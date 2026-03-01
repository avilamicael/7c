# apps/financeiro/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.financeiro.contas_pagar.models import ParcelaContaPagar
from apps.financeiro.contas_receber.models import ParcelaContaReceber


@receiver(post_save, sender=ParcelaContaPagar)
def atualizar_status_conta_pagar(sender, instance, **kwargs):
    instance.conta_pagar.recalcular_status()


@receiver(post_save, sender=ParcelaContaReceber)
def atualizar_status_conta_receber(sender, instance, **kwargs):
    instance.conta_receber.recalcular_status()