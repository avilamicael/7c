# apps/tarefas/signals.py

from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Tarefa


@receiver(pre_save, sender=Tarefa)
def _cache_estado_anterior(sender, instance, **kwargs):
    if not instance.pk:
        instance._status_anterior        = None
        instance._atribuido_a_anterior   = None
        instance._vencimento_anterior    = None
        return
    try:
        anterior = Tarefa.objects.get(pk=instance.pk)
        instance._status_anterior        = anterior.status
        instance._atribuido_a_anterior   = anterior.atribuido_a_id
        instance._vencimento_anterior    = anterior.data_vencimento
    except Tarefa.DoesNotExist:
        instance._status_anterior        = None
        instance._atribuido_a_anterior   = None
        instance._vencimento_anterior    = None


@receiver(post_save, sender=Tarefa)
def _sincronizar_card(sender, instance, created, **kwargs):
    """Quando o status da tarefa muda, move o card vinculado para a coluna correspondente."""
    if getattr(instance, "_skip_card_sync", False):
        return
    if created or not instance.card_id:
        return
    if getattr(instance, "_status_anterior", None) == instance.status:
        return

    from apps.kanban.models import KanbanCard, KanbanColunaAcao

    acao = (
        KanbanColunaAcao.objects
        .filter(
            coluna__board=instance.card.coluna.board,
            tipo=KanbanColunaAcao.Tipo.ALTERAR_STATUS_TAREFA,
            parametro=instance.status,
        )
        .select_related("coluna")
        .first()
    )

    if acao:
        KanbanCard.objects.filter(pk=instance.card_id).update(coluna=acao.coluna)


@receiver(post_save, sender=Tarefa)
def _disparar_notificacoes(sender, instance, created, **kwargs):
    from apps.core import services

    atribuido_a_anterior = getattr(instance, "_atribuido_a_anterior", None)
    status_anterior      = getattr(instance, "_status_anterior", None)
    vencimento_anterior  = getattr(instance, "_vencimento_anterior", None)

    # Tarefa criada com responsável
    if created and instance.atribuido_a_id:
        services.tarefa_atribuida(instance)
        return

    # Responsável alterado
    if not created and instance.atribuido_a_id and instance.atribuido_a_id != atribuido_a_anterior:
        services.tarefa_atribuida(instance)

    # Tarefa concluída
    if not created and instance.status == Tarefa.Status.CONCLUIDA and status_anterior != Tarefa.Status.CONCLUIDA:
        services.tarefa_concluida(instance)

    # Data de vencimento alterada
    if (
        not created
        and instance.atribuido_a_id
        and instance.data_vencimento
        and instance.data_vencimento != vencimento_anterior
    ):
        services.tarefa_reagendada(instance, vencimento_anterior)
