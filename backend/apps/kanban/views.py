from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.shortcuts import get_object_or_404
from django.db.models import Q

from apps.core.utils import get_empresa_do_membro
from apps.core.permissions import IsAdminEmpresa, IsMembroEmpresa
from apps.kanban.models import KanbanBoard, KanbanColuna, KanbanCard
from apps.kanban.serializers import (
    KanbanBoardSerializer,
    KanbanBoardWriteSerializer,
    KanbanColunaSerializer,
    KanbanColunaWriteSerializer,
    KanbanCardReadSerializer,
    KanbanCardWriteSerializer,
)


class KanbanBoardViewSet(viewsets.ModelViewSet):
    permission_classes = [IsMembroEmpresa]
    lookup_field = "public_id"

    def get_empresa(self):
        if not hasattr(self, "_empresa"):
            self._empresa = get_empresa_do_membro(self.request.user)
        return self._empresa

    def get_queryset(self):
        empresa = self.get_empresa()
        user    = self.request.user
        qs = KanbanBoard.objects.filter(empresa=empresa, ativo=True)
        if not IsAdminEmpresa().has_permission(self.request, self):
            qs = qs.filter(Q(compartilhado=True) | Q(membros=user))
        return qs.prefetch_related("colunas__acoes", "colunas__cards__responsavel").distinct()

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return KanbanBoardWriteSerializer
        return KanbanBoardSerializer

    def _check_admin(self):
        if not IsAdminEmpresa().has_permission(self.request, self):
            raise PermissionDenied("Apenas administradores podem realizar esta ação.")

    def _check_limite_boards(self, empresa):
        limite = empresa.limite_boards
        count  = KanbanBoard.objects.filter(empresa=empresa, ativo=True).count()
        if count >= limite:
            raise ValidationError(f"Limite de {limite} board(s) atingido para esta empresa.")

    def create(self, request, *args, **kwargs):
        self._check_admin()
        empresa = self.get_empresa()
        self._check_limite_boards(empresa)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(empresa=empresa, criado_por=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        self._check_admin()
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        self._check_admin()
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        self._check_admin()
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="membros")
    def gerenciar_membros(self, request, public_id=None):
        self._check_admin()
        board   = self.get_object()
        empresa = self.get_empresa()

        adicionar = request.data.get("adicionar", [])
        remover   = request.data.get("remover", [])

        from apps.usuarios.models import Usuario
        membros_empresa = Usuario.objects.filter(
            empresa_vinculo__empresa=empresa,
            empresa_vinculo__ativo=True,
            public_id__in=adicionar + remover,
        )

        board.membros.add(*membros_empresa.filter(public_id__in=adicionar))
        board.membros.remove(*membros_empresa.filter(public_id__in=remover))

        return Response({"detail": "Membros atualizados."})


class KanbanColunaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsMembroEmpresa]
    lookup_field = "public_id"

    def get_empresa(self):
        if not hasattr(self, "_empresa"):
            self._empresa = get_empresa_do_membro(self.request.user)
        return self._empresa

    def get_board(self):
        if not hasattr(self, "_board"):
            self._board = get_object_or_404(
                KanbanBoard,
                public_id=self.kwargs["board_public_id"],
                empresa=self.get_empresa(),
            )
        return self._board

    def get_queryset(self):
        return KanbanColuna.objects.filter(board=self.get_board()).prefetch_related("acoes", "cards__responsavel")

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return KanbanColunaWriteSerializer
        return KanbanColunaSerializer

    def _check_admin(self):
        if not IsAdminEmpresa().has_permission(self.request, self):
            raise PermissionDenied("Apenas administradores podem realizar esta ação.")

    def create(self, request, *args, **kwargs):
        self._check_admin()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(board=self.get_board())
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        self._check_admin()
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        self._check_admin()
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        self._check_admin()
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=["post"])
    def reordenar(self, request, board_public_id=None):
        self._check_admin()
        board = self.get_board()
        items = request.data

        if not isinstance(items, list):
            return Response(
                {"detail": "Envie uma lista de {public_id, posicao}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for item in items:
            KanbanColuna.objects.filter(
                public_id=item.get("public_id"),
                board=board,
            ).update(posicao=int(item.get("posicao", 0)))

        return Response({"detail": "Colunas reordenadas."})


class KanbanCardViewSet(viewsets.ModelViewSet):
    permission_classes = [IsMembroEmpresa]
    lookup_field = "public_id"

    def get_empresa(self):
        if not hasattr(self, "_empresa"):
            self._empresa = get_empresa_do_membro(self.request.user)
        return self._empresa

    def get_queryset(self):
        return (
            KanbanCard.objects
            .filter(empresa=self.get_empresa(), ativo=True)
            .select_related("coluna__board", "responsavel", "criado_por")
        )

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return KanbanCardWriteSerializer
        return KanbanCardReadSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["empresa"] = self.get_empresa()
        return ctx

    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        card = serializer.save(criado_por=request.user)
        return Response(
            KanbanCardReadSerializer(card, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        card = serializer.save()
        return Response(KanbanCardReadSerializer(card, context=self.get_serializer_context()).data)

    @action(detail=True, methods=["post"])
    def mover(self, request, public_id=None):
        card                 = self.get_object()
        coluna_anterior_nome = card.coluna.nome
        coluna_public_id     = request.data.get("coluna")
        posicao              = request.data.get("posicao")

        if not coluna_public_id:
            return Response({"detail": "Campo 'coluna' obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

        coluna = get_object_or_404(
            KanbanColuna,
            public_id=coluna_public_id,
            board__empresa=self.get_empresa(),
        )

        card.coluna = coluna
        if posicao is not None:
            card.posicao = int(posicao)
        card.save(update_fields=["coluna", "posicao", "data_atualizacao"])

        from apps.kanban.services import executar_acoes_coluna
        executar_acoes_coluna(
            card=card,
            coluna=coluna,
            movido_por=request.user,
            coluna_anterior_nome=coluna_anterior_nome,
        )

        return Response(KanbanCardReadSerializer(card, context=self.get_serializer_context()).data)

    @action(detail=True, methods=["post"])
    def arquivar(self, request, public_id=None):
        card = self.get_object()
        card.ativo = False
        card.save(update_fields=["ativo", "data_atualizacao"])
        return Response({"detail": "Card arquivado."})

    @action(detail=False, methods=["post"])
    def reordenar(self, request):
        empresa     = self.get_empresa()
        items       = request.data

        if not isinstance(items, list):
            return Response(
                {"detail": "Envie uma lista de {public_id, posicao}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ids_validos = {
            str(x) for x in KanbanCard.objects
            .filter(empresa=empresa)
            .values_list("public_id", flat=True)
        }

        for item in items:
            uid = item.get("public_id")
            pos = item.get("posicao")
            if uid and pos is not None and uid in ids_validos:
                KanbanCard.objects.filter(public_id=uid, empresa=empresa).update(posicao=int(pos))

        return Response({"detail": "Reordenado."})
