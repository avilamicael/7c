from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from apps.core.utils import get_empresa_do_membro
from .models import Fornecedor
from .serializers import FornecedorSerializer


class FornecedorViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = FornecedorSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["razao_social", "nome_fantasia", "cnpj", "cpf"]
    ordering_fields = ["razao_social", "data_cadastro"]
    lookup_field = "public_id"

    def get_queryset(self):
        empresa = get_empresa_do_membro(self.request.user)
        return Fornecedor.objects.filter(empresa=empresa)

    def perform_create(self, serializer):
        empresa = get_empresa_do_membro(self.request.user)
        serializer.save(empresa=empresa)