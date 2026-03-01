# apps/financeiro/contas_receber/models.py

import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from apps.empresas.models import Empresa
from apps.financeiro.shared.models import Categoria, ContaBancaria, FormaPagamento, RecalcularStatusMixin


class ContaReceber(RecalcularStatusMixin):
    class Tipo(models.TextChoices):
        SERVICO  = "SERVICO",  "Serviço / Pacote"
        COMISSAO = "COMISSAO", "Comissão"

    class Status(models.TextChoices):
        PENDENTE          = "PENDENTE",     "Pendente"
        PARCIALMENTE_PAGA = "PARC_PAGA",   "Parcialmente Recebida"
        RECEBIDA          = "RECEBIDA",     "Recebida"
        VENCIDA           = "VENCIDA",      "Vencida"
        CANCELADA         = "CANCELADA",    "Cancelada"
        BAIXA_MANUAL      = "BAIXA_MANUAL", "Baixa Manual"

    public_id  = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    empresa    = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name="contas_receber")
    tipo       = models.CharField(max_length=10, choices=Tipo.choices, default=Tipo.SERVICO, db_index=True)
    criado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="contas_receber_criadas", null=True)

    cliente    = models.ForeignKey("clientes.Cliente", on_delete=models.PROTECT, related_name="contas_receber", null=True, blank=True)
    fornecedor = models.ForeignKey("fornecedores.Fornecedor", on_delete=models.PROTECT, related_name="comissoes_pagar", null=True, blank=True)

    percentual_comissao = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    valor_base_comissao = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    categoria        = models.ForeignKey(Categoria, on_delete=models.PROTECT, related_name="contas_receber", null=True, blank=True)
    numero_documento = models.CharField(max_length=100, blank=True, db_index=True)
    descricao        = models.CharField(max_length=500, blank=True)
    forma_pagamento  = models.CharField(max_length=3, choices=FormaPagamento.choices, default=FormaPagamento.PIX)
    total_parcelas   = models.PositiveSmallIntegerField(default=1)

    status        = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDENTE, db_index=True)
    status_manual = models.BooleanField(default=False)

    data_competencia = models.DateField()
    data_cadastro    = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = "Conta a Receber"
        verbose_name_plural = "Contas a Receber"
        ordering            = ["-data_competencia", "-data_cadastro"]
        indexes = [
            models.Index(fields=["empresa", "status"]),
            models.Index(fields=["empresa", "tipo"]),
            models.Index(fields=["empresa", "cliente"]),
            models.Index(fields=["empresa", "fornecedor"]),
        ]

    def __str__(self) -> str:
        origem = self.cliente or self.fornecedor or "—"
        return f"CR-{self.pk} | {origem} | {self.get_status_display()}"

    def recalcular_status(self) -> None:
        super().recalcular_status(
            status_pago     = self.Status.RECEBIDA,
            status_parcial  = self.Status.PARCIALMENTE_PAGA,
            status_vencida  = self.Status.VENCIDA,
            status_pendente = self.Status.PENDENTE,
            parcela_status_pago = ParcelaContaReceber.Status.RECEBIDA,
        )


class ParcelaContaReceber(models.Model):
    class Status(models.TextChoices):
        PENDENTE  = "PENDENTE",  "Pendente"
        RECEBIDA  = "RECEBIDA",  "Recebida"
        VENCIDA   = "VENCIDA",   "Vencida"
        CANCELADA = "CANCELADA", "Cancelada"

    conta_receber  = models.ForeignKey(ContaReceber, on_delete=models.PROTECT, related_name="parcelas")
    numero_parcela = models.PositiveSmallIntegerField()

    data_competencia = models.DateField(null=True, blank=True)
    data_vencimento  = models.DateField(db_index=True)
    data_recebimento = models.DateField(null=True, blank=True)

    valor_bruto       = models.DecimalField(max_digits=12, decimal_places=2)
    juros             = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    multa             = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    outros_acrescimos = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    desconto          = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    valor_recebido    = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    saldo             = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))

    conta_bancaria = models.ForeignKey(ContaBancaria, on_delete=models.PROTECT, related_name="parcelas_recebidas", null=True, blank=True)
    status         = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDENTE, db_index=True)
    observacoes    = models.TextField(blank=True)

    class Meta:
        verbose_name        = "Parcela (CR)"
        verbose_name_plural = "Parcelas (CR)"
        ordering            = ["conta_receber", "numero_parcela"]
        constraints = [
            models.UniqueConstraint(fields=["conta_receber", "numero_parcela"], name="unique_numero_parcela_por_conta_receber")
        ]

    def __str__(self) -> str:
        return f"Parcela {self.numero_parcela}/{self.conta_receber.total_parcelas} — CR-{self.conta_receber_id}"

    def calcular_saldo(self) -> Decimal:
        total_devido = self.valor_bruto + self.juros + self.multa + self.outros_acrescimos - self.desconto
        return max(total_devido - self.valor_recebido, Decimal("0.00"))

    def save(self, *args, **kwargs) -> None:
        self.saldo = self.calcular_saldo()
        if self.valor_recebido > Decimal("0.00") and self.saldo == Decimal("0.00"):
            self.status = self.Status.RECEBIDA
        super().save(*args, **kwargs)


class BaixaContaReceber(models.Model):
    class Tipo(models.TextChoices):
        CANCELAMENTO  = "CANCELAMENTO",  "Cancelamento"
        BAIXA_MANUAL  = "BAIXA_MANUAL",  "Baixa Manual"
        INADIMPLENCIA = "INADIMPLENCIA", "Inadimplência"

    conta_receber = models.ForeignKey(ContaReceber, on_delete=models.PROTECT, related_name="baixas")
    usuario       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="baixas_contas_receber")
    tipo          = models.CharField(max_length=15, choices=Tipo.choices)
    motivo        = models.TextField()
    data_baixa    = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Baixa (CR)"
        verbose_name_plural = "Baixas (CR)"
        ordering            = ["-data_baixa"]

    def __str__(self) -> str:
        return f"{self.get_tipo_display()} — CR-{self.conta_receber_id} em {self.data_baixa:%d/%m/%Y}"