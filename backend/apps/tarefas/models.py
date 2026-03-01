# apps/tarefas/models.py

import uuid
from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericRelation
from apps.empresas.models import Empresa
from apps.core.models import Notificacao


class Tarefa(models.Model):
    class Prioridade(models.TextChoices):
        BAIXA   = "BAIXA",   "Baixa"
        MEDIA   = "MEDIA",   "Média"
        ALTA    = "ALTA",    "Alta"
        URGENTE = "URGENTE", "Urgente"

    class Status(models.TextChoices):
        PENDENTE     = "PENDENTE",     "Pendente"
        EM_PROGRESSO = "EM_PROGRESSO", "Em Progresso"
        CONCLUIDA    = "CONCLUIDA",    "Concluída"
        CANCELADA    = "CANCELADA",    "Cancelada"

    public_id  = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    empresa    = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name="tarefas")
    titulo     = models.CharField(max_length=255)
    descricao  = models.TextField(blank=True)
    prioridade = models.CharField(max_length=10, choices=Prioridade.choices, default=Prioridade.MEDIA, db_index=True)
    status     = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDENTE, db_index=True)

    criado_por  = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name="tarefas_criadas"
    )
    atribuido_a = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name="tarefas_atribuidas"
    )

    # vínculo opcional com KanbanCard — OneToOne garante que um card tem no máximo uma tarefa
    card = models.OneToOneField(
        "kanban.KanbanCard",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tarefa",
    )

    data_vencimento     = models.DateTimeField(db_index=True)
    lembrete_em         = models.DateTimeField(null=True, blank=True)
    lembrete_notificado = models.BooleanField(default=False)
    data_conclusao      = models.DateTimeField(null=True, blank=True)
    data_cadastro       = models.DateTimeField(auto_now_add=True)
    data_atualizacao    = models.DateTimeField(auto_now=True)

    # acesso reverso às notificações desta tarefa
    notificacoes = GenericRelation(
        Notificacao,
        content_type_field="content_type",
        object_id_field="object_id",
    )

    class Meta:
        verbose_name        = "Tarefa"
        verbose_name_plural = "Tarefas"
        ordering            = ["data_vencimento", "-prioridade"]
        indexes = [
            models.Index(fields=["empresa", "status"]),
            models.Index(fields=["empresa", "atribuido_a", "status"]),
            models.Index(fields=["empresa", "prioridade"]),
            models.Index(fields=["data_vencimento", "status"]),
            models.Index(fields=["lembrete_em", "lembrete_notificado"]),
        ]

    def __str__(self) -> str:
        return f"{self.titulo} [{self.get_prioridade_display()}]"