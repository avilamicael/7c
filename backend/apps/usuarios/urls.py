from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    MeuPerfilView,
    AtualizarAvatarView,
    AlterarSenhaView,
    CriarUsuarioView,
    ListarUsuariosView,
    DesativarUsuarioView,
    LoginView,
    LogoutView,
)
from .throttles import LoginRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView


class LoginThrottledView(TokenObtainPairView):
    throttle_classes = [LoginRateThrottle]


urlpatterns = [
    # auth — ficam sob api/auth/
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),

    # perfil — ficam sob api/usuarios/
    path("me/", MeuPerfilView.as_view(), name="me"),
    path("me/avatar/", AtualizarAvatarView.as_view(), name="me_avatar"),
    path("me/senha/", AlterarSenhaView.as_view(), name="me_senha"),

    # admin — ficam sob api/usuarios/
    path("criar/", CriarUsuarioView.as_view(), name="criar_usuario"),
    path("", ListarUsuariosView.as_view(), name="listar_usuarios"),
    path("<uuid:public_id>/desativar/", DesativarUsuarioView.as_view(), name="desativar_usuario"),
]