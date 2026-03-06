# apps/tarefas/views.py

from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.utils import get_empresa_do_membro
from apps.empresas.models import UsuarioEmpresa
from .models import Tarefa
from .serializers import TarefaReadSerializer, TarefaWriteSerializer


class TarefaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    lookup_field = "public_id"

    def get_vinculo(self):
        if not hasattr(self, "_vinculo"):
            self._vinculo = self.request.user.empresa_vinculo
        return self._vinculo

    def get_empresa(self):
        if not hasattr(self, "_empresa"):
            self._empresa = self.get_vinculo().empresa
        return self._empresa

    def is_admin(self):
        return self.get_vinculo().role == UsuarioEmpresa.Role.ADMIN

    def get_queryset(self):
        empresa = self.get_empresa()
        user    = self.request.user

        qs = (
            Tarefa.objects
            .filter(empresa=empresa)
            .select_related("criado_por", "atribuido_a", "card")
        )

        # Operadores só enxergam tarefas que criaram ou que foram atribuídas a eles
        if not self.is_admin():
            qs = qs.filter(Q(criado_por=user) | Q(atribuido_a=user))

        params = self.request.query_params

        if status_param := params.get("status"):
            qs = qs.filter(status=status_param)

        if prioridade := params.get("prioridade"):
            qs = qs.filter(prioridade=prioridade)

        if atribuido_a := params.get("atribuido_a"):
            qs = qs.filter(atribuido_a__public_id=atribuido_a)

        if params.get("minhas") == "true":
            qs = qs.filter(atribuido_a=user)

        if params.get("vencidas") == "true":
            from django.utils import timezone
            qs = qs.filter(
                data_vencimento__lt=timezone.localdate(),
            ).exclude(status__in=[Tarefa.Status.CONCLUIDA, Tarefa.Status.CANCELADA])

        return qs

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return TarefaWriteSerializer
        return TarefaReadSerializer

    def perform_create(self, serializer):
        serializer.save(
            empresa=self.get_empresa(),
            criado_por=self.request.user,
        )

    @action(detail=True, methods=["post"])
    def concluir(self, request, public_id=None):
        tarefa = self.get_object()
        if tarefa.status == Tarefa.Status.CANCELADA:
            return Response(
                {"detail": "Tarefa cancelada não pode ser concluída."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        tarefa.status = Tarefa.Status.CONCLUIDA
        tarefa.save()
        return Response(TarefaReadSerializer(tarefa, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def cancelar(self, request, public_id=None):
        tarefa = self.get_object()
        if tarefa.status == Tarefa.Status.CONCLUIDA:
            return Response(
                {"detail": "Tarefa concluída não pode ser cancelada. Reabra primeiro."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        tarefa.status = Tarefa.Status.CANCELADA
        tarefa.save()
        return Response(TarefaReadSerializer(tarefa, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def reabrir(self, request, public_id=None):
        tarefa = self.get_object()
        if tarefa.status == Tarefa.Status.PENDENTE:
            return Response(
                {"detail": "Tarefa já está pendente."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        tarefa.status = Tarefa.Status.PENDENTE
        tarefa.save()
        return Response(TarefaReadSerializer(tarefa, context={"request": request}).data)
