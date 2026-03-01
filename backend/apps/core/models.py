# apps/core/models.py
from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class AuditLog(models.Model):
    class Acao(models.TextChoices):
        CRIADO = "CRIADO"
        EDITADO = "EDITADO"
        INATIVADO = "INATIVADO"
        ATIVADO = "ATIVADO"
        MOVIDO = "MOVIDO"
        REORDENADO = "REORDENADO"
        REMOVIDO = "REMOVIDO"
        LOGIN = "LOGIN"
        LOGOUT = "LOGOUT"
        BAIXA = "BAIXA"
        CANCELAMENTO = "CANCELAMENTO"
        PAGAMENTO = "PAGAMENTO"

    empresa = models.ForeignKey(
        "empresas.Empresa", on_delete=models.CASCADE, related_name="audit_logs"
    )
    usuario = models.ForeignKey(
        "usuarios.Usuario", on_delete=models.SET_NULL, null=True, related_name="+"
    )
    acao = models.CharField(max_length=20, choices=Acao.choices)
    modulo = models.CharField(max_length=30)   # "kanban" | "clientes" | "financeiro"
    objeto_tipo = models.CharField(max_length=50)  # "KanbanCard" | "Cliente" | "ContaPagar"
    objeto_id = models.PositiveIntegerField()
    objeto_repr = models.CharField(max_length=255)  # str() do objeto no momento
    payload = models.JSONField(default=dict)   # diff before/after
    ip = models.GenericIPAddressField(null=True)
    data = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-data"]
        indexes = [
            models.Index(fields=["empresa", "-data"]),
            models.Index(fields=["modulo", "objeto_tipo", "objeto_id"]),
            models.Index(fields=["usuario", "-data"]),
        ]

class Notificacao(models.Model):
    class Tipo(models.TextChoices):
        TAREFA_ATRIBUIDA   = "TAREFA_ATRIBUIDA",   "Tarefa Atribuída"
        TAREFA_CONCLUIDA   = "TAREFA_CONCLUIDA",   "Tarefa Concluída"
        TAREFA_VENCIMENTO  = "TAREFA_VENCIMENTO",  "Vencimento de Tarefa"
        TAREFA_LEMBRETE    = "TAREFA_LEMBRETE",    "Lembrete de Tarefa"
        TAREFA_REAGENDADA  = "TAREFA_REAGENDADA",  "Tarefa Reagendada"
        KANBAN_CARD_MOVIDO = "KANBAN_CARD_MOVIDO", "Card Movido"
        # novos tipos adicionados aqui

    empresa = models.ForeignKey(
        "empresas.Empresa", on_delete=models.CASCADE, related_name="notificacoes"
    )

    # origem genérica — qualquer model do sistema
    content_type = models.ForeignKey(
        ContentType, on_delete=models.SET_NULL, null=True, blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    origem    = GenericForeignKey("content_type", "object_id")

    tipo         = models.CharField(max_length=30, choices=Tipo.choices, db_index=True)
    payload      = models.JSONField(default=dict)
    data_criacao = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name        = "Notificação"
        verbose_name_plural = "Notificações"
        ordering            = ["-data_criacao"]
        indexes = [
            models.Index(fields=["empresa", "-data_criacao"]),
            models.Index(fields=["content_type", "object_id"]),
            models.Index(fields=["tipo", "data_criacao"]),
        ]

    def __str__(self) -> str:
        return f"{self.get_tipo_display()} [{self.data_criacao:%d/%m/%Y %H:%M}]"

class NotificacaoDestinatario(models.Model):
    class Canal(models.TextChoices):
        WEB      = "WEB",      "Web (WebSocket)"
        EMAIL    = "EMAIL",    "E-mail"
        WHATSAPP = "WHATSAPP", "WhatsApp"
        TELEGRAM = "TELEGRAM", "Telegram"

    class Status(models.TextChoices):
        PENDENTE = "PENDENTE", "Pendente"
        ENVIADA  = "ENVIADA",  "Enviada"
        FALHOU   = "FALHOU",   "Falhou"

    notificacao = models.ForeignKey(
        Notificacao, on_delete=models.CASCADE, related_name="destinatarios"
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notificacoes_recebidas"
    )
    canal        = models.CharField(max_length=10, choices=Canal.choices, default=Canal.WEB)
    status       = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDENTE, db_index=True)
    lida         = models.BooleanField(default=False, db_index=True)
    tentativas   = models.PositiveSmallIntegerField(default=0)
    data_envio   = models.DateTimeField(null=True, blank=True)
    data_leitura = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name        = "Destinatário de Notificação"
        verbose_name_plural = "Destinatários de Notificações"
        ordering            = ["-notificacao__data_criacao"]
        constraints = [
            models.UniqueConstraint(
                fields=["notificacao", "usuario", "canal"],
                name="unique_destinatario_por_canal"
            )
        ]
        indexes = [
            models.Index(fields=["usuario", "lida"]),
            models.Index(fields=["usuario", "status"]),
            models.Index(fields=["status", "canal"]),
            models.Index(fields=["notificacao", "usuario"]),
        ]

    def __str__(self) -> str:
        return f"{self.usuario} | {self.canal} | {self.status}"






