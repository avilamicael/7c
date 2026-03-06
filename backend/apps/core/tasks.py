# apps/core/tasks.py

from celery import shared_task


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def entregar_notificacao(self, notificacao_id):
    from django.utils import timezone
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    from apps.core.models import Notificacao, NotificacaoDestinatario

    try:
        notificacao = Notificacao.objects.get(pk=notificacao_id)
    except Notificacao.DoesNotExist:
        return

    destinatarios = list(
        NotificacaoDestinatario.objects.filter(
            notificacao=notificacao,
            canal=NotificacaoDestinatario.Canal.WEB,
            status=NotificacaoDestinatario.Status.PENDENTE,
        )
    )

    channel_layer = get_channel_layer()

    for dest in destinatarios:
        try:
            async_to_sync(channel_layer.group_send)(
                f"notificacoes_usuario_{dest.usuario_id}",
                {
                    "type": "notificacao_nova",
                    "data": {
                        "id": dest.pk,
                        "tipo": notificacao.tipo,
                        "payload": notificacao.payload,
                        "data_criacao": notificacao.data_criacao.isoformat(),
                        "lida": False,
                    },
                },
            )
            dest.status = NotificacaoDestinatario.Status.ENVIADA
            dest.data_envio = timezone.now()
        except Exception as exc:
            dest.tentativas += 1
            dest.status = NotificacaoDestinatario.Status.FALHOU
            dest.save(update_fields=["status", "tentativas"])
            raise self.retry(exc=exc)

        dest.save(update_fields=["status", "data_envio"])
