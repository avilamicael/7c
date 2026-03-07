# apps/kanban/models.py

import uuid
from django.db import models
from django.contrib.contenttypes.fields import GenericRelation
from apps.empresas.models import Empresa
from apps.usuarios.models import Usuario
from apps.core.models import Notificacao


class KanbanBoard(models.Model):
    public_id        = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    empresa          = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name="boards")
    nome             = models.CharField(max_length=150)
    descricao        = models.TextField(blank=True, default="")
    ativo            = models.BooleanField(default=True)
    compartilhado    = models.BooleanField(default=True)
    membros          = models.ManyToManyField(Usuario, blank=True, related_name="boards_acesso")
    criado_por       = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name="boards_criados")
    data_criacao     = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-data_criacao"]

    def __str__(self):
        return f"{self.empresa.nome_fantasia} — {self.nome}"


class KanbanColuna(models.Model):
    public_id  = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    board      = models.ForeignKey(KanbanBoard, on_delete=models.CASCADE, related_name="colunas")
    nome       = models.CharField(max_length=100)
    posicao    = models.PositiveIntegerField()
    cor        = models.CharField(max_length=7, default="#5dca6c")
    limite_wip = models.PositiveIntegerField(null=True, blank=True)
    data_criacao = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["posicao"]

    def __str__(self):
        return f"{self.board.nome} › {self.nome}"


class KanbanColunaAcao(models.Model):
    """
    Define o que acontece automaticamente quando um card entra nesta coluna.
    Uma coluna pode ter múltiplas ações.
    """
    class Tipo(models.TextChoices):
        ALTERAR_STATUS_TAREFA = "ALTERAR_STATUS_TAREFA", "Alterar status da tarefa"
        ALTERAR_PRIORIDADE    = "ALTERAR_PRIORIDADE",    "Alterar prioridade"
        NOTIFICAR_RESPONSAVEL = "NOTIFICAR_RESPONSAVEL", "Notificar responsável"
        NOTIFICAR_EMPRESA     = "NOTIFICAR_EMPRESA",     "Notificar toda a empresa"

    # Valores válidos por tipo de ação — usados na validação do serializer
    PARAMETROS_VALIDOS = {
        Tipo.ALTERAR_STATUS_TAREFA: ["PENDENTE", "EM_PROGRESSO", "CONCLUIDA", "CANCELADA"],
        Tipo.ALTERAR_PRIORIDADE:    ["BAIXA", "MEDIA", "ALTA", "URGENTE"],
        Tipo.NOTIFICAR_RESPONSAVEL: [""],
        Tipo.NOTIFICAR_EMPRESA:     [""],
    }

    coluna    = models.ForeignKey(KanbanColuna, on_delete=models.CASCADE, related_name="acoes")
    tipo      = models.CharField(max_length=30, choices=Tipo.choices)
    parametro = models.CharField(max_length=50, blank=True)

    class Meta:
        verbose_name        = "Ação de Coluna"
        verbose_name_plural = "Ações de Coluna"
        constraints = [
            # cada tipo de ação pode existir apenas uma vez por coluna
            models.UniqueConstraint(fields=["coluna", "tipo"], name="unique_acao_por_coluna")
        ]

    def __str__(self) -> str:
        return f"{self.coluna.nome} → {self.get_tipo_display()} ({self.parametro or '—'})"


class KanbanCard(models.Model):
    class Prioridade(models.TextChoices):
        BAIXA   = "BAIXA",   "Baixa"
        MEDIA   = "MEDIA",   "Média"
        ALTA    = "ALTA",    "Alta"
        URGENTE = "URGENTE", "Urgente"

    public_id        = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    empresa          = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name="kanban_cards", null=True)
    coluna           = models.ForeignKey(KanbanColuna, on_delete=models.CASCADE, related_name="cards")
    titulo           = models.CharField(max_length=255)
    descricao        = models.TextField(blank=True, default="")
    posicao          = models.PositiveIntegerField()
    prioridade       = models.CharField(max_length=10, choices=Prioridade.choices, default=Prioridade.MEDIA)
    data_vencimento  = models.DateField(null=True, blank=True)
    lembrete_em      = models.DateTimeField(null=True, blank=True)
    responsavel      = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name="cards_responsavel")
    criado_por       = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name="cards_criados")
    ativo            = models.BooleanField(default=True)
    data_criacao     = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    notificacoes = GenericRelation(
        Notificacao,
        content_type_field="content_type",
        object_id_field="object_id",
    )

    class Meta:
        ordering = ["posicao"]

    def save(self, *args, **kwargs):
        if not self.empresa_id:
            self.empresa = self.coluna.board.empresa
        super().save(*args, **kwargs)

    def __str__(self):
        return self.titulo