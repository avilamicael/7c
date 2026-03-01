# apps/financeiro/contas_pagar/models.py

import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from apps.empresas.models import Empresa
from apps.fornecedores.models import Fornecedor
from apps.financeiro.shared.models import Categoria, ContaBancaria, FormaPagamento, RecalcularStatusMixin


class ContaPagar(RecalcularStatusMixin):
    class Status(models.TextChoices):
        PENDENTE          = "PENDENTE",     "Pendente"
        PARCIALMENTE_PAGA = "PARC_PAGA",   "Parcialmente Paga"
        PAGA              = "PAGA",         "Paga"
        VENCIDA           = "VENCIDA",      "Vencida"
        CANCELADA         = "CANCELADA",    "Cancelada"
        BAIXA_MANUAL      = "BAIXA_MANUAL", "Baixa Manual"

    public_id        = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    empresa          = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name="contas_pagar")
    fornecedor       = models.ForeignKey(Fornecedor, on_delete=models.PROTECT, related_name="contas_pagar")
    categoria        = models.ForeignKey(Categoria, on_delete=models.PROTECT, related_name="contas_pagar", null=True, blank=True)
    criado_por       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="contas_pagar_criadas", null=True)

    numero_documento = models.CharField(max_length=100, blank=True, db_index=True)
    descricao        = models.CharField(max_length=500, blank=True)
    forma_pagamento  = models.CharField(max_length=3, choices=FormaPagamento.choices, default=FormaPagamento.BOLETO)
    total_parcelas   = models.PositiveSmallIntegerField(default=1)

    status        = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDENTE, db_index=True)
    status_manual = models.BooleanField(default=False)

    data_competencia = models.DateField()
    data_cadastro    = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = "Conta a Pagar"
        verbose_name_plural = "Contas a Pagar"
        ordering            = ["-data_competencia", "-data_cadastro"]
        indexes = [
            models.Index(fields=["empresa", "status"]),
            models.Index(fields=["empresa", "fornecedor"]),
        ]

    def __str__(self) -> str:
        return f"CP-{self.pk} | {self.fornecedor} | {self.get_status_display()}"

    def recalcular_status(self) -> None:
        super().recalcular_status(
            status_pago     = self.Status.PAGA,
            status_parcial  = self.Status.PARCIALMENTE_PAGA,
            status_vencida  = self.Status.VENCIDA,
            status_pendente = self.Status.PENDENTE,
            parcela_status_pago = ParcelaContaPagar.Status.PAGA,
        )


class NotaFiscalCP(models.Model):
    conta_pagar = models.ForeignKey(ContaPagar, on_delete=models.CASCADE, related_name="notas_fiscais")
    numero      = models.CharField(max_length=50)
    serie       = models.CharField(max_length=10, blank=True)

    class Meta:
        verbose_name        = "Nota Fiscal (CP)"
        verbose_name_plural = "Notas Fiscais (CP)"
        constraints = [
            models.UniqueConstraint(fields=["conta_pagar", "numero", "serie"], name="unique_nf_por_conta_pagar")
        ]

    def __str__(self) -> str:
        return f"NF {self.numero}/{self.serie or '0'}"


class ParcelaContaPagar(models.Model):
    class Status(models.TextChoices):
        PENDENTE  = "PENDENTE",  "Pendente"
        PAGA      = "PAGA",      "Paga"
        VENCIDA   = "VENCIDA",   "Vencida"
        CANCELADA = "CANCELADA", "Cancelada"

    conta_pagar    = models.ForeignKey(ContaPagar, on_delete=models.PROTECT, related_name="parcelas")
    numero_parcela = models.PositiveSmallIntegerField()
    cod_barras     = models.CharField(max_length=60, blank=True)

    data_competencia  = models.DateField(null=True, blank=True)
    data_movimentacao = models.DateField(null=True, blank=True)
    data_vencimento   = models.DateField(db_index=True)
    data_pagamento    = models.DateField(null=True, blank=True)

    valor_bruto       = models.DecimalField(max_digits=12, decimal_places=2)
    juros             = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    multa             = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    outros_acrescimos = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    desconto          = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    valor_pago        = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    saldo             = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))

    conta_bancaria = models.ForeignKey(ContaBancaria, on_delete=models.PROTECT, related_name="parcelas_pagas", null=True, blank=True)
    status         = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDENTE, db_index=True)
    observacoes    = models.TextField(blank=True)

    class Meta:
        verbose_name        = "Parcela (CP)"
        verbose_name_plural = "Parcelas (CP)"
        ordering            = ["conta_pagar", "numero_parcela"]
        constraints = [
            models.UniqueConstraint(fields=["conta_pagar", "numero_parcela"], name="unique_numero_parcela_por_conta")
        ]

    def __str__(self) -> str:
        return f"Parcela {self.numero_parcela}/{self.conta_pagar.total_parcelas} — CP-{self.conta_pagar_id}"

    def calcular_saldo(self) -> Decimal:
        total_devido = self.valor_bruto + self.juros + self.multa + self.outros_acrescimos - self.desconto
        return max(total_devido - self.valor_pago, Decimal("0.00"))

    def save(self, *args, **kwargs) -> None:
        self.saldo = self.calcular_saldo()
        if self.valor_pago > Decimal("0.00") and self.saldo == Decimal("0.00"):
            self.status = self.Status.PAGA
        super().save(*args, **kwargs)


class BaixaContaPagar(models.Model):
    class Tipo(models.TextChoices):
        CANCELAMENTO = "CANCELAMENTO", "Cancelamento"
        BAIXA_MANUAL = "BAIXA_MANUAL", "Baixa Manual"
        RENEGOCIACAO = "RENEGOCIACAO", "Renegociação"

    conta_pagar = models.ForeignKey(ContaPagar, on_delete=models.PROTECT, related_name="baixas")
    usuario     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="baixas_contas_pagar")
    tipo        = models.CharField(max_length=15, choices=Tipo.choices)
    motivo      = models.TextField()
    data_baixa  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Baixa (CP)"
        verbose_name_plural = "Baixas (CP)"
        ordering            = ["-data_baixa"]

    def __str__(self) -> str:
        return f"{self.get_tipo_display()} — CP-{self.conta_pagar_id} em {self.data_baixa:%d/%m/%Y}"