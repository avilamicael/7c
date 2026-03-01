from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.views import TokenObtainPairView
from apps.core.permissions import IsAdminEmpresa
from apps.empresas.models import UsuarioEmpresa
from .models import Usuario
from .serializers import UsuarioSerializer, CriarUsuarioSerializer, AlterarSenhaSerializer, UsuarioEmpresaListSerializer
from .throttles import LoginRateThrottle
from apps.core.utils import get_empresa_do_admin

class LoginView(TokenObtainPairView):
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        return response

    def handle_exception(self, exc):
        from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken
        if isinstance(exc, (AuthenticationFailed, InvalidToken)):
            return Response(
                {'detail': 'E-mail ou senha inválidos.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        return super().handle_exception(exc)

class AlterarSenhaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AlterarSenhaSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Senha alterada com sucesso.'}, status=status.HTTP_200_OK)

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'detail': 'Refresh token é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response({'detail': 'Token inválido ou já expirado.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'detail': 'Logout realizado com sucesso.'}, status=status.HTTP_200_OK)

class CriarUsuarioView(generics.CreateAPIView):
    serializer_class = CriarUsuarioSerializer
    permission_classes = [IsAdminEmpresa]

    def perform_create(self, serializer):
        empresa = get_empresa_do_admin(self.request.user)
        usuario = serializer.save()
        UsuarioEmpresa.objects.create(
            usuario=usuario,
            empresa=empresa,
            role=UsuarioEmpresa.Role.OPERADOR
        )

class ListarUsuariosView(generics.ListAPIView):
    serializer_class = UsuarioEmpresaListSerializer
    permission_classes = [IsAdminEmpresa]

    def get_queryset(self):
        empresa = get_empresa_do_admin(self.request.user)
        return UsuarioEmpresa.objects.filter(
            empresa=empresa,
        ).select_related('usuario').order_by('usuario__nome')

class DesativarUsuarioView(APIView):
    permission_classes = [IsAdminEmpresa]

    def patch(self, request, public_id):
        empresa = get_empresa_do_admin(request.user)
        vinculo = UsuarioEmpresa.objects.filter(
            usuario__public_id=public_id,
            empresa=empresa,
            role=UsuarioEmpresa.Role.OPERADOR
        ).first()

        if not vinculo:
            return Response({'detail': 'Usuário não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        vinculo.ativo = not vinculo.ativo
        vinculo.save(update_fields=['ativo'])

        status_text = 'ativado' if vinculo.ativo else 'desativado'
        return Response({'detail': f'Usuário {status_text} com sucesso.', 'ativo': vinculo.ativo})

class MeuPerfilView(generics.RetrieveUpdateAPIView):
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
