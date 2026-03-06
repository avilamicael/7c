# apps/tarefas/serializers.py

from rest_framework import serializers
from django.utils import timezone
from apps.core.utils import get_empresa_do_membro
from apps.kanban.models import KanbanCard
from .models import Tarefa


class MembroEmpresaField(serializers.SlugRelatedField):
    def get_queryset(self):
        from apps.usuarios.models import Usuario
        empresa = get_empresa_do_membro(self.context["request"].user)
        return Usuario.objects.filter(
            empresa_vinculo__empresa=empresa,
            empresa_vinculo__ativo=True,
        )


class CardEmpresaField(serializers.SlugRelatedField):
    def get_queryset(self):
        empresa = get_empresa_do_membro(self.context["request"].user)
        return KanbanCard.objects.filter(empresa=empresa, ativo=True)


class TarefaReadSerializer(serializers.ModelSerializer):
    criado_por_nome       = serializers.SerializerMethodField()
    atribuido_a_nome      = serializers.SerializerMethodField()
    atribuido_a_public_id = serializers.UUIDField(source="atribuido_a.public_id", read_only=True, default=None)
    card_public_id        = serializers.UUIDField(source="card.public_id", read_only=True, default=None)
    card_titulo           = serializers.CharField(source="card.titulo", read_only=True, default=None)
    vencida               = serializers.SerializerMethodField()

    class Meta:
        model  = Tarefa
        fields = [
            "public_id",
            "titulo", "descricao",
            "prioridade", "status",
            "criado_por_nome", "atribuido_a_nome", "atribuido_a_public_id",
            "card_public_id", "card_titulo",
            "data_vencimento", "lembrete_em",
            "data_conclusao", "data_cadastro", "data_atualizacao",
            "vencida",
        ]

    def get_criado_por_nome(self, obj):
        if obj.criado_por:
            return f"{obj.criado_por.nome} {obj.criado_por.sobrenome}".strip()
        return None

    def get_atribuido_a_nome(self, obj):
        if obj.atribuido_a:
            return f"{obj.atribuido_a.nome} {obj.atribuido_a.sobrenome}".strip()
        return None

    def get_vencida(self, obj):
        if not obj.data_vencimento:
            return False
        if obj.status in [Tarefa.Status.CONCLUIDA, Tarefa.Status.CANCELADA]:
            return False
        return obj.data_vencimento < timezone.localdate()


class TarefaWriteSerializer(serializers.ModelSerializer):
    atribuido_a = MembroEmpresaField(
        slug_field="public_id",
        required=False,
        allow_null=True,
    )
    card = CardEmpresaField(
        slug_field="public_id",
        required=False,
        allow_null=True,
    )

    class Meta:
        model  = Tarefa
        fields = [
            "titulo", "descricao",
            "prioridade", "status",
            "atribuido_a", "card",
            "data_vencimento", "lembrete_em",
        ]

    def validate_card(self, card):
        if card is None:
            return card
        try:
            tarefa_existente = card.tarefa
            if self.instance is None or tarefa_existente.pk != self.instance.pk:
                raise serializers.ValidationError("Este card já está vinculado a outra tarefa.")
        except Tarefa.DoesNotExist:
            pass
        return card
