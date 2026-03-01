# apps/financeiro/contas_receber/views.py

from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from apps.core.utils import get_empresa_do_membro
from .models import ContaReceber, ParcelaContaReceber
from .serializers import (
    ContaReceberReadSerializer,
    ContaReceberWriteSerializer,
    ParcelaContaReceberSerializer,
    RegistrarRecebimentoSerializer,
    BaixaContaReceberSerializer,
)


class ContaReceberViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    lookup_field       = "public_id"

    def get_empresa(self):
        if not hasattr(self, "_empresa"):
            self._empresa = get_empresa_do_membro(self.request.user)
        return self._empresa

    def get_queryset(self):
        return (
            ContaReceber.objects
            .filter(empresa=self.get_empresa())
            .select_related("cliente", "fornecedor", "categoria", "criado_por")
            .prefetch_related("parcelas__conta_bancaria")
        )

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ContaReceberWriteSerializer
        return ContaReceberReadSerializer

    def get_object(self):
        return get_object_or_404(self.get_queryset(), public_id=self.kwargs["public_id"])

    @action(detail=True, methods=["post"], url_path="baixa")
    def baixa(self, request, public_id=None):
        conta = self.get_object()

        if conta.status in [ContaReceber.Status.CANCELADA, ContaReceber.Status.RECEBIDA]:
            return Response(
                {"detail": f"Conta '{conta.get_status_display()}' não pode receber baixa."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = BaixaContaReceberSerializer(
            data=request.data,
            context={"request": request, "conta_receber": conta},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Baixa registrada com sucesso."}, status=status.HTTP_200_OK)


class ParcelaContaReceberViewSet(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated]
    serializer_class   = ParcelaContaReceberSerializer

    def get_queryset(self):
        empresa = get_empresa_do_membro(self.request.user)
        return ParcelaContaReceber.objects.select_related(
            "conta_receber__empresa", "conta_bancaria"
        ).filter(conta_receber__empresa=empresa)

    @action(detail=True, methods=["post"], url_path="registrar-recebimento")
    def registrar_recebimento(self, request, pk=None):
        parcela = self.get_object()

        if parcela.status == ParcelaContaReceber.Status.CANCELADA:
            return Response(
                {"detail": "Parcela cancelada não pode ser recebida."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = RegistrarRecebimentoSerializer(
            instance=parcela,
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        parcela_atualizada = serializer.save()
        return Response(ParcelaContaReceberSerializer(parcela_atualizada).data, status=status.HTTP_200_OK)