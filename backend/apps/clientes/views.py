from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from apps.core.permissions import IsAdminEmpresa, IsMembroEmpresa
from apps.empresas.models import UsuarioEmpresa
from .models import Cliente, ClienteDocumento, ClienteTelefone
from .serializers import ClienteSerializer, ClienteListSerializer, ClienteDocumentoSerializer, ClienteTelefoneSerializer
from apps.core.utils import get_empresa_do_membro


class ListarClientesView(generics.ListAPIView):
    serializer_class   = ClienteListSerializer
    permission_classes = [IsMembroEmpresa]

    def get_queryset(self):
        empresa = get_empresa_do_membro(self.request.user)
        return (
            Cliente.objects
            .filter(empresa=empresa)
            .prefetch_related('documentos', 'telefones')
            .order_by('nome', 'sobrenome')
        )

class CriarClienteView(generics.CreateAPIView):
    serializer_class   = ClienteSerializer
    permission_classes = [IsMembroEmpresa]

    def perform_create(self, serializer):
        empresa = get_empresa_do_membro(self.request.user)
        serializer.save(
            empresa=empresa,
            criado_por=self.request.user,
            atualizado_por=self.request.user,
        )


class DetalharClienteView(generics.RetrieveAPIView):
    serializer_class   = ClienteSerializer
    permission_classes = [IsMembroEmpresa]
    lookup_field       = 'public_id'

    def get_queryset(self):
        empresa = get_empresa_do_membro(self.request.user)
        return Cliente.objects.filter(empresa=empresa).prefetch_related('documentos', 'telefones')


class EditarClienteView(generics.UpdateAPIView):
    serializer_class   = ClienteSerializer
    permission_classes = [IsMembroEmpresa]
    lookup_field       = 'public_id'
    http_method_names  = ['patch']

    def get_queryset(self):
        empresa = get_empresa_do_membro(self.request.user)
        return (
            Cliente.objects
            .filter(empresa=empresa)
            .prefetch_related('documentos', 'telefones')
        )

    def perform_update(self, serializer):
        serializer.save(atualizado_por=self.request.user)


class InativarClienteView(APIView):
    permission_classes = [IsAdminEmpresa]

    def patch(self, request, public_id):
        empresa = get_empresa_do_membro(request.user)
        cliente = Cliente.objects.filter(public_id=public_id, empresa=empresa).first()

        if not cliente:
            return Response({'detail': 'Cliente não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        cliente.ativo = not cliente.ativo
        cliente.save(update_fields=['ativo'])
        return Response({'ativo': cliente.ativo})

class ClienteDocumentoView(generics.ListCreateAPIView):
    serializer_class   = ClienteDocumentoSerializer
    permission_classes = [IsMembroEmpresa]

    def get_cliente(self):
        empresa = get_empresa_do_membro(self.request.user)
        cliente = Cliente.objects.filter(public_id=self.kwargs['public_id'], empresa=empresa).first()
        if not cliente:
            raise PermissionDenied()
        return cliente

    def get_queryset(self):
        return ClienteDocumento.objects.filter(cliente=self.get_cliente())

    def perform_create(self, serializer):
        serializer.save(cliente=self.get_cliente())


class ClienteTelefoneView(generics.ListCreateAPIView):
    serializer_class   = ClienteTelefoneSerializer
    permission_classes = [IsMembroEmpresa]

    def get_cliente(self):
        empresa = get_empresa_do_membro(self.request.user)
        cliente = Cliente.objects.filter(public_id=self.kwargs['public_id'], empresa=empresa).first()
        if not cliente:
            raise PermissionDenied()
        return cliente

    def get_queryset(self):
        return ClienteTelefone.objects.filter(cliente=self.get_cliente())

    def perform_create(self, serializer):
        serializer.save(cliente=self.get_cliente())