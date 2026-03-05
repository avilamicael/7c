# apps/financeiro/shared/views.py

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.core.utils import get_empresa_do_membro
from .models import Categoria, ContaBancaria
from .serializers import CategoriaSerializer, ContaBancariaSerializer


class EmpresaScopedViewSet(viewsets.ModelViewSet):
    """Mixin base que resolve empresa uma única vez por request."""
    permission_classes = [IsAuthenticated]
    lookup_field = "public_id"

    def get_empresa(self):
        if not hasattr(self, "_empresa"):
            self._empresa = get_empresa_do_membro(self.request.user)
        return self._empresa

    def get_queryset(self):
        raise NotImplementedError

    def perform_create(self, serializer):
        serializer.save(empresa=self.get_empresa())


class CategoriaViewSet(EmpresaScopedViewSet):
    serializer_class = CategoriaSerializer

    def get_queryset(self):
        return Categoria.objects.filter(empresa=self.get_empresa())


class ContaBancariaViewSet(EmpresaScopedViewSet):
    serializer_class = ContaBancariaSerializer

    def get_queryset(self):
        return ContaBancaria.objects.filter(empresa=self.get_empresa())