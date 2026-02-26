from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from apps.core.permissions import IsSuperAdmin, IsAdminEmpresa, IsMembroEmpresa
from apps.usuarios.views import get_empresa_do_admin
from .models import Empresa, UsuarioEmpresa, CreditoExtra
from .serializers import (
    MinhaEmpresaSerializer, EmpresaEditarSerializer,
    CreditoExtraSerializer, PersonalizacaoSerializer
)


class MinhaEmpresaView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsMembroEmpresa]

    def get_serializer_class(self):
        # Admin pode editar, membro só visualiza
        vinculo = UsuarioEmpresa.objects.filter(
            usuario=self.request.user,
            role=UsuarioEmpresa.Role.ADMIN,
            ativo=True
        ).exists()
        if self.request.method in ('PUT', 'PATCH') and vinculo:
            return EmpresaEditarSerializer
        return MinhaEmpresaSerializer

    def get_object(self):
        return UsuarioEmpresa.objects.select_related('empresa').filter(
            usuario=self.request.user,
            ativo=True
        ).first().empresa

class PersonalizacaoEmpresaView(generics.RetrieveUpdateAPIView):
    """Admin da empresa edita personalização da própria empresa."""
    serializer_class   = PersonalizacaoSerializer
    permission_classes = [IsAdminEmpresa]

    def get_object(self):
        empresa = get_empresa_do_admin(self.request.user)
        return empresa.personalizacao

class AdicionarCreditoView(APIView):
    """Superadmin adiciona créditos extras à empresa."""
    permission_classes = [IsSuperAdmin]

    def post(self, request, empresa_public_id):
        empresa = get_object_or_404(Empresa, public_id=empresa_public_id)
        serializer = CreditoExtraSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        CreditoExtra.objects.create(empresa=empresa, **serializer.validated_data)
        empresa.creditos_extras += serializer.validated_data['quantidade']
        empresa.save(update_fields=['creditos_extras'])
        return Response({'cota_disponivel': empresa.cota_disponivel}, status=status.HTTP_200_OK)