from rest_framework import serializers
from apps.kanban.models import KanbanBoard, KanbanColuna, KanbanCard


class KanbanColunaSerializer(serializers.ModelSerializer):
    class Meta:
        model = KanbanColuna
        fields = ["public_id", "nome", "posicao", "cor", "limite_wip"]


class KanbanBoardSerializer(serializers.ModelSerializer):
    colunas = KanbanColunaSerializer(many=True, read_only=True)

    class Meta:
        model = KanbanBoard
        fields = ["public_id", "nome", "descricao", "ativo", "colunas", "data_criacao"]
        read_only_fields = ["public_id", "data_criacao"]


class KanbanBoardWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = KanbanBoard
        fields = ["nome", "descricao", "ativo"]


class KanbanColunaWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = KanbanColuna
        fields = ["nome", "posicao", "cor", "limite_wip"]


class KanbanCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = KanbanCard
        fields = [
            "public_id", "coluna", "titulo", "descricao", "posicao",
            "prioridade", "data_vencimento", "responsavel", "ativo",
            "data_criacao", "data_atualizacao",
        ]
        read_only_fields = ["public_id", "data_criacao", "data_atualizacao"]

    def validate_coluna(self, coluna):
        empresa = self.context["empresa"]
        if coluna.board.empresa_id != empresa.id:
            raise serializers.ValidationError("Coluna não pertence à empresa.")
        return coluna

    def validate_responsavel(self, usuario):
        if usuario is None:
            return usuario
        empresa = self.context["empresa"]
        if not usuario.empresa_vinculo.empresa_id == empresa.id:
            raise serializers.ValidationError("Responsável não pertence à empresa.")
        return usuario