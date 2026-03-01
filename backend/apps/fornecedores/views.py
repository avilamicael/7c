from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
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
        return Fornecedor.objects.filter(empresa=self.request.user.empresa_ativa)

    def perform_create(self, serializer):
        serializer.save(empresa=self.request.user.empresa_ativa)