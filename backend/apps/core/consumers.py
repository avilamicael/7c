import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class NotificacaoConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]

        if user.is_anonymous:
            await self.close()
            return

        self.group_name = f"notificacoes_usuario_{user.pk}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # envia notificações não lidas ao conectar
        nao_lidas = await self._get_nao_lidas(user.pk)
        if nao_lidas:
            await self.send(text_data=json.dumps({
                "tipo": "nao_lidas",
                "data": nao_lidas,
            }))

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        """Recebe ações do frontend: marcar como lida."""
        try:
            data = json.loads(text_data)
        except (json.JSONDecodeError, TypeError):
            return

        acao = data.get("acao")

        if acao == "marcar_lida":
            destinatario_id = data.get("destinatario_id")
            if destinatario_id:
                await self._marcar_lida(destinatario_id, self.scope["user"].pk)

        elif acao == "marcar_todas_lidas":
            await self._marcar_todas_lidas(self.scope["user"].pk)

    # handler chamado pelo Celery via group_send
    async def notificacao_nova(self, event):
        await self.send(text_data=json.dumps({
            "tipo": "nova_notificacao",
            "data": event["data"],
        }))

    @database_sync_to_async
    def _get_nao_lidas(self, usuario_id):
        from apps.core.models import NotificacaoDestinatario
        return list(
            NotificacaoDestinatario.objects
            .filter(
                usuario_id=usuario_id,
                lida=False,
                canal=NotificacaoDestinatario.Canal.WEB,
                status=NotificacaoDestinatario.Status.ENVIADA,
            )
            .select_related("notificacao")
            .values(
                "id",
                "notificacao__tipo",
                "notificacao__payload",
                "notificacao__data_criacao",
                "lida",
            )
            .order_by("-notificacao__data_criacao")[:50]
        )

    @database_sync_to_async
    def _marcar_lida(self, destinatario_id, usuario_id):
        from apps.core.models import NotificacaoDestinatario
        NotificacaoDestinatario.objects.filter(
            pk=destinatario_id,
            usuario_id=usuario_id,  # garante que só marca a própria notificação
        ).update(lida=True, data_leitura=timezone.now())

    @database_sync_to_async
    def _marcar_todas_lidas(self, usuario_id):
        from apps.core.models import NotificacaoDestinatario
        NotificacaoDestinatario.objects.filter(
            usuario_id=usuario_id,
            lida=False,
            canal=NotificacaoDestinatario.Canal.WEB,
        ).update(lida=True, data_leitura=timezone.now())