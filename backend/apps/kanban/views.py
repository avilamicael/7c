from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.shortcuts import get_object_or_404

from apps.core.utils import get_empresa_do_membro
from apps.core.permissions import IsAdminEmpresa, IsMembroEmpresa
from apps.kanban.models import KanbanBoard, KanbanColuna, KanbanCard
from apps.kanban.serializers import (
    KanbanBoardSerializer,
    KanbanBoardWriteSerializer,
    KanbanColunaWriteSerializer,
    KanbanCardSerializer,
)


class KanbanBoardViewSet(viewsets.ModelViewSet):
    permission_classes = [IsMembroEmpresa]
    lookup_field = "public_id"

    def get_empresa(self):
        if not hasattr(self, "_empresa"):
            self._empresa = get_empresa_do_membro(self.request)
        return self._empresa

    def get_queryset(self):
        return (
            KanbanBoard.objects.filter(empresa=self.get_empresa())
            .prefetch_related("colunas")
        )

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return KanbanBoardWriteSerializer
        return KanbanBoardSerializer

    def _check_admin(self):
        if not IsAdminEmpresa().has_permission(self.request, self):
            raise PermissionDenied("Apenas administradores podem realizar esta ação.")

    def _check_limite_boards(self, empresa):
        limite = empresa.limite_boards
        count = KanbanBoard.objects.filter(empresa=empresa, ativo=True).count()
        if count >= limite:
            raise ValidationError(
                f"Limite de {limite} board(s) atingido para esta empresa."
            )

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


class KanbanColunaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsMembroEmpresa]
    lookup_field = "public_id"
    serializer_class = KanbanColunaWriteSerializer

    def get_empresa(self):
        if not hasattr(self, "_empresa"):
            self._empresa = get_empresa_do_membro(self.request)
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
        return KanbanColuna.objects.filter(board=self.get_board())

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


class KanbanCardViewSet(viewsets.ModelViewSet):
    permission_classes = [IsMembroEmpresa]
    lookup_field = "public_id"
    serializer_class = KanbanCardSerializer

    def get_empresa(self):
        if not hasattr(self, "_empresa"):
            self._empresa = get_empresa_do_membro(self.request)
        return self._empresa

    def get_queryset(self):
        empresa = self.get_empresa()
        return (
            KanbanCard.objects.filter(coluna__board__empresa=empresa)
            .select_related("coluna", "responsavel", "criado_por")
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["empresa"] = self.get_empresa()
        return ctx

    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)