from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from apps.usuarios.throttles import LoginRateThrottle
from .views import CriarUsuarioView, ListarUsuariosView, MeuPerfilView, AlterarSenhaView, DesativarUsuarioView

class LoginView(TokenObtainPairView):
    throttle_classes = [LoginRateThrottle]


urlpatterns = [
    path('login/',    TokenObtainPairView.as_view(), name='token_obtain'),
    path('refresh/',  TokenRefreshView.as_view(),    name='token_refresh'),
    path('criar/',    CriarUsuarioView.as_view(),    name='criar_usuario'),
    path('',          ListarUsuariosView.as_view(),  name='listar_usuarios'),
    path('me/',       MeuPerfilView.as_view(),       name='meu_perfil'),
    path('me/senha/', AlterarSenhaView.as_view(),    name='alterar_senha'),
    path('<uuid:public_id>/desativar/', DesativarUsuarioView.as_view(), name='desativar_usuario'),

]