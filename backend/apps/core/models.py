# apps/core/models.py
from django.db import models

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