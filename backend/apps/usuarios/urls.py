from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView,
    LogoutView,
    CriarUsuarioView,
    ListarUsuariosView,
    AlterarSenhaView,
    DesativarUsuarioView,
    MeuPerfilView,
)

urlpatterns = [
    path('login/',    LoginView.as_view(),        name='auth-login'),
    path('refresh/',  TokenRefreshView.as_view(),  name='auth-refresh'),
    path('logout/',   LogoutView.as_view(),        name='auth-logout'),
    path('me/',       MeuPerfilView.as_view(),     name='auth-me'),
    path('me/senha/', AlterarSenhaView.as_view(),  name='auth-senha'),

    path('criar/',    CriarUsuarioView.as_view(),  name='criar-usuario'),
    path('',          ListarUsuariosView.as_view(), name='listar-usuarios'),
    path('<uuid:public_id>/desativar/', DesativarUsuarioView.as_view(), name='desativar-usuario'),
]