from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.views import TokenObtainPairView
from apps.core.permissions import IsAdminEmpresa
from apps.empresas.models import UsuarioEmpresa
from .serializers import UsuarioSerializer, CriarUsuarioSerializer, AlterarSenhaSerializer, AvatarSerializer, AtualizarPerfilSerializer
from rest_framework.throttling import UserRateThrottle
from .throttles import LoginRateThrottle
from apps.core.utils import get_empresa_do_admin
from rest_framework.permissions import IsAuthenticated

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
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def post(self, request):
        serializer = AlterarSenhaSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Senha alterada com sucesso."})


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

class CriarUsuarioView(APIView):
    permission_classes = [IsAdminEmpresa]

    def post(self, request):
        serializer = CriarUsuarioSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        empresa = get_empresa_do_admin(request.user)
        usuario = serializer.save()
        UsuarioEmpresa.objects.create(
            usuario=usuario,
            empresa=empresa,
            role="operador",
        )
        return Response(
            UsuarioSerializer(usuario, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

class ListarUsuariosView(APIView):
    permission_classes = [IsAdminEmpresa]

    def get(self, request):
        empresa = get_empresa_do_admin(request.user)
        vinculos = (
            UsuarioEmpresa.objects.filter(empresa=empresa)
            .select_related("usuario")
        )
        usuarios = [v.usuario for v in vinculos]
        serializer = UsuarioSerializer(
            usuarios, many=True, context={"request": request}
        )
        return Response(serializer.data)

class DesativarUsuarioView(APIView):
    permission_classes = [IsAdminEmpresa]

    def patch(self, request, public_id):
        empresa = get_empresa_do_admin(request.user)
        try:
            vinculo = UsuarioEmpresa.objects.select_related("usuario").get(
                usuario__public_id=public_id,
                empresa=empresa,
            )
        except UsuarioEmpresa.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if vinculo.role == "admin":
            raise PermissionDenied("Não é possível desativar um admin.")

        usuario = vinculo.usuario
        usuario.is_active = not usuario.is_active
        usuario.save(update_fields=["is_active"])
        return Response({"is_active": usuario.is_active})


class MeuPerfilView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UsuarioSerializer(request.user, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = AtualizarPerfilSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UsuarioSerializer(request.user, context={"request": request}).data)

class AtualizarAvatarView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        # Deleta avatar anterior para não acumular arquivos
        user = request.user
        old_avatar = user.avatar

        serializer = AvatarSerializer(user, data=request.data)
        serializer.is_valid(raise_exception=True)

        if old_avatar:
            try:
                old_avatar.delete(save=False)
            except Exception:
                pass

        serializer.save()
        return Response(
            UsuarioSerializer(user, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )