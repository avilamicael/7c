# apps/financeiro/shared/models.py

from django.db import models
from django.utils import timezone
from apps.empresas.models import Empresa


class FormaPagamento(models.TextChoices):
    PIX           = "PIX", "PIX"
    BOLETO        = "BOL", "Boleto"
    CARTAO        = "CAR", "Cartão"
    TRANSFERENCIA = "TED", "Transferência Bancária (TED/DOC)"
    CHEQUE        = "CHQ", "Cheque"
    DINHEIRO      = "DIN", "Dinheiro"
    OUTRO         = "OUT", "Outro"


class RecalcularStatusMixin(models.Model):
    status        = models.CharField(max_length=15, db_index=True)
    status_manual = models.BooleanField(default=False)

    class Meta:
        abstract = True

    def recalcular_status(self, status_pago, status_parcial, status_vencida, status_pendente, parcela_status_pago):
        if self.status_manual:
            return

        parcelas = self.parcelas.all()
        if not parcelas.exists():
            return

        total   = parcelas.count()
        pagas   = parcelas.filter(status=parcela_status_pago).count()
        today   = timezone.localdate()
        vencidas = parcelas.filter(status="PENDENTE", data_vencimento__lt=today).count()

        if pagas == total:
            novo_status = status_pago
        elif pagas > 0:
            novo_status = status_parcial
        elif vencidas > 0:
            novo_status = status_vencida
        else:
            novo_status = status_pendente

        if self.status != novo_status:
            self.__class__.objects.filter(pk=self.pk).update(status=novo_status)


class Categoria(models.Model):
    empresa   = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name="categorias_financeiras")
    nome      = models.CharField(max_length=100)
    descricao = models.CharField(max_length=255, blank=True)
    ativo     = models.BooleanField(default=True, db_index=True)

    class Meta:
        verbose_name        = "Categoria"
        verbose_name_plural = "Categorias"
        ordering            = ["nome"]
        constraints = [
            models.UniqueConstraint(fields=["empresa", "nome"], name="unique_categoria_por_empresa")
        ]

    def __str__(self) -> str:
        return self.nome


class ContaBancaria(models.Model):
    class Tipo(models.TextChoices):
        CORRENTE = "CC", "Conta Corrente"
        POUPANCA = "CP", "Conta Poupança"
        PIX      = "PI", "Conta PIX"
        CAIXA    = "CX", "Caixa"

    empresa    = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name="contas_bancarias")
    banco_nome = models.CharField(max_length=100)
    agencia    = models.CharField(max_length=10, blank=True)
    conta      = models.CharField(max_length=20, blank=True)
    tipo       = models.CharField(max_length=2, choices=Tipo.choices, default=Tipo.CORRENTE)
    descricao  = models.CharField(max_length=255, blank=True)
    ativo      = models.BooleanField(default=True, db_index=True)

    class Meta:
        verbose_name        = "Conta Bancária"
        verbose_name_plural = "Contas Bancárias"
        ordering            = ["banco_nome"]

    def __str__(self) -> str:
        return f"{self.banco_nome} — {self.get_tipo_display()} {self.conta or ''}".strip()