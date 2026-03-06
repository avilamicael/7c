# apps/tarefas/tasks.py

from celery import shared_task


@shared_task
def processar_lembretes():
    from django.utils import timezone
    from apps.tarefas.models import Tarefa
    from apps.core.services import tarefa_lembrete

    agora = timezone.now()
    tarefas = (
        Tarefa.objects
        .filter(
            lembrete_em__lte=agora,
            lembrete_notificado=False,
            atribuido_a__isnull=False,
        )
        .exclude(status__in=[Tarefa.Status.CONCLUIDA, Tarefa.Status.CANCELADA])
        .select_related("empresa", "criado_por", "atribuido_a")
    )

    for tarefa in tarefas:
        tarefa_lembrete(tarefa)
        tarefa.lembrete_notificado = True
        tarefa.save(update_fields=["lembrete_notificado"])


@shared_task
def processar_vencimentos():
    from django.utils import timezone
    from django.contrib.contenttypes.models import ContentType
    from apps.tarefas.models import Tarefa
    from apps.core.models import Notificacao
    from apps.core.services import tarefa_vencimento

    hoje = timezone.localdate()
    tarefas = (
        Tarefa.objects
        .filter(data_vencimento=hoje)
        .exclude(status__in=[Tarefa.Status.CONCLUIDA, Tarefa.Status.CANCELADA])
        .select_related("empresa", "criado_por", "atribuido_a")
    )

    ct = ContentType.objects.get_for_model(Tarefa)
    ja_notificadas = set(
        Notificacao.objects
        .filter(
            content_type=ct,
            tipo=Notificacao.Tipo.TAREFA_VENCIMENTO,
            data_criacao__date=hoje,
        )
        .values_list("object_id", flat=True)
    )

    for tarefa in tarefas:
        if tarefa.pk not in ja_notificadas:
            tarefa_vencimento(tarefa)
