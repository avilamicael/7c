from rest_framework import serializers
from apps.kanban.models import KanbanBoard, KanbanColuna, KanbanCard, KanbanColunaAcao
from apps.usuarios.models import Usuario
from apps.empresas.models import UsuarioEmpresa


# ─── Helpers de campo ─────────────────────────────────────────────────────────

class MembroEmpresaField(serializers.SlugRelatedField):
    """Aceita public_id de um usuário ativo na empresa."""
    def get_queryset(self):
        empresa = self.context["empresa"]
        return Usuario.objects.filter(
            empresa_vinculo__empresa=empresa,
            empresa_vinculo__ativo=True,
        )


class ColunaEmpresaField(serializers.SlugRelatedField):
    """Aceita public_id de uma coluna pertencente à empresa."""
    def get_queryset(self):
        empresa = self.context["empresa"]
        return KanbanColuna.objects.filter(board__empresa=empresa)


# ─── Ações de Coluna ──────────────────────────────────────────────────────────

class KanbanColunaAcaoSerializer(serializers.ModelSerializer):
    class Meta:
        model  = KanbanColunaAcao
        fields = ["id", "tipo", "parametro"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        tipo      = attrs.get("tipo")
        parametro = attrs.get("parametro", "")
        validos   = KanbanColunaAcao.PARAMETROS_VALIDOS.get(tipo, [])
        if parametro not in validos:
            raise serializers.ValidationError(
                {"parametro": f"Parâmetro inválido para o tipo '{tipo}'. Válidos: {validos}"}
            )
        return attrs


# ─── Card ─────────────────────────────────────────────────────────────────────

class KanbanCardReadSerializer(serializers.ModelSerializer):
    coluna_public_id    = serializers.UUIDField(source="coluna.public_id", read_only=True)
    coluna_nome         = serializers.CharField(source="coluna.nome", read_only=True)
    responsavel_public_id = serializers.SerializerMethodField()
    responsavel_nome    = serializers.SerializerMethodField()
    tarefa_public_id    = serializers.SerializerMethodField()
    tarefa_titulo       = serializers.SerializerMethodField()
    tarefa_status       = serializers.SerializerMethodField()

    class Meta:
        model  = KanbanCard
        fields = [
            "public_id", "titulo", "descricao", "posicao",
            "prioridade", "data_vencimento", "lembrete_em", "ativo",
            "coluna_public_id", "coluna_nome",
            "responsavel_public_id", "responsavel_nome",
            "tarefa_public_id", "tarefa_titulo", "tarefa_status",
            "data_criacao", "data_atualizacao",
        ]
        read_only_fields = fields

    def get_responsavel_public_id(self, obj):
        return str(obj.responsavel.public_id) if obj.responsavel_id else None

    def get_responsavel_nome(self, obj):
        if not obj.responsavel_id:
            return None
        return f"{obj.responsavel.nome} {obj.responsavel.sobrenome}".strip()

    def get_tarefa_public_id(self, obj):
        try:
            return str(obj.tarefa.public_id)
        except Exception:
            return None

    def get_tarefa_titulo(self, obj):
        try:
            return obj.tarefa.titulo
        except Exception:
            return None

    def get_tarefa_status(self, obj):
        try:
            return obj.tarefa.status
        except Exception:
            return None


class KanbanCardWriteSerializer(serializers.ModelSerializer):
    coluna      = ColunaEmpresaField(slug_field="public_id")
    responsavel = MembroEmpresaField(slug_field="public_id", required=False, allow_null=True)

    class Meta:
        model  = KanbanCard
        fields = ["coluna", "titulo", "descricao", "posicao", "prioridade", "data_vencimento", "lembrete_em", "responsavel"]


# ─── Coluna ───────────────────────────────────────────────────────────────────

class KanbanColunaCardSerializer(serializers.ModelSerializer):
    """Serializer compacto de card para uso dentro de KanbanColunaSerializer."""
    responsavel_public_id = serializers.SerializerMethodField()
    responsavel_nome      = serializers.SerializerMethodField()
    tarefa_public_id      = serializers.SerializerMethodField()
    tarefa_status         = serializers.SerializerMethodField()

    class Meta:
        model  = KanbanCard
        fields = [
            "public_id", "titulo", "descricao", "posicao",
            "prioridade", "data_vencimento", "lembrete_em",
            "responsavel_public_id", "responsavel_nome",
            "tarefa_public_id", "tarefa_status",
        ]

    def get_responsavel_public_id(self, obj):
        return str(obj.responsavel.public_id) if obj.responsavel_id else None

    def get_responsavel_nome(self, obj):
        if not obj.responsavel_id:
            return None
        return f"{obj.responsavel.nome} {obj.responsavel.sobrenome}".strip()

    def get_tarefa_public_id(self, obj):
        try:
            return str(obj.tarefa.public_id)
        except Exception:
            return None

    def get_tarefa_status(self, obj):
        try:
            return obj.tarefa.status
        except Exception:
            return None


class KanbanColunaSerializer(serializers.ModelSerializer):
    acoes               = KanbanColunaAcaoSerializer(many=True, read_only=True)
    cards               = serializers.SerializerMethodField()
    acao_alterar_status = serializers.SerializerMethodField()

    class Meta:
        model  = KanbanColuna
        fields = ["public_id", "nome", "posicao", "cor", "limite_wip", "acao_alterar_status", "acoes", "cards"]

    def get_acao_alterar_status(self, obj):
        for acao in obj.acoes.all():
            if acao.tipo == KanbanColunaAcao.Tipo.ALTERAR_STATUS_TAREFA:
                return acao.parametro
        return None

    def get_cards(self, obj):
        cards = obj.cards.filter(ativo=True).select_related("responsavel").order_by("posicao")
        return KanbanColunaCardSerializer(cards, many=True).data


class KanbanColunaWriteSerializer(serializers.ModelSerializer):
    acao_alterar_status = serializers.CharField(
        required=False, allow_null=True, allow_blank=True, write_only=True
    )

    class Meta:
        model  = KanbanColuna
        fields = ["nome", "posicao", "cor", "limite_wip", "acao_alterar_status"]

    def _sync_acao_status(self, coluna, valor):
        if valor:
            KanbanColunaAcao.objects.update_or_create(
                coluna=coluna,
                tipo=KanbanColunaAcao.Tipo.ALTERAR_STATUS_TAREFA,
                defaults={"parametro": valor},
            )
        else:
            KanbanColunaAcao.objects.filter(
                coluna=coluna,
                tipo=KanbanColunaAcao.Tipo.ALTERAR_STATUS_TAREFA,
            ).delete()

    def create(self, validated_data):
        acao   = validated_data.pop("acao_alterar_status", None)
        coluna = super().create(validated_data)
        if acao is not None:
            self._sync_acao_status(coluna, acao)
        return coluna

    def update(self, instance, validated_data):
        send_acao = "acao_alterar_status" in self.initial_data
        acao      = validated_data.pop("acao_alterar_status", None)
        coluna    = super().update(instance, validated_data)
        if send_acao:
            self._sync_acao_status(coluna, acao)
        return coluna


# ─── Board ────────────────────────────────────────────────────────────────────

class KanbanBoardSerializer(serializers.ModelSerializer):
    colunas = KanbanColunaSerializer(many=True, read_only=True)

    class Meta:
        model  = KanbanBoard
        fields = [
            "public_id", "nome", "descricao", "ativo",
            "compartilhado", "colunas", "data_criacao",
        ]
        read_only_fields = ["public_id", "data_criacao"]


class KanbanBoardWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = KanbanBoard
        fields = ["nome", "descricao", "ativo", "compartilhado", "membros"]
