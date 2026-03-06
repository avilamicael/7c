# apps/core/serializers.py

from rest_framework import serializers
from .models import NotificacaoDestinatario


class NotificacaoDestinatarioSerializer(serializers.ModelSerializer):
    tipo    = serializers.CharField(source="notificacao.tipo", read_only=True)
    payload = serializers.JSONField(source="notificacao.payload", read_only=True)
    data_criacao = serializers.DateTimeField(source="notificacao.data_criacao", read_only=True)

    class Meta:
        model  = NotificacaoDestinatario
        fields = ["id", "tipo", "payload", "lida", "data_criacao", "data_leitura"]
        read_only_fields = fields
