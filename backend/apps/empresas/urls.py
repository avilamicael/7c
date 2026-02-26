from django.urls import path
from .views import MinhaEmpresaView, AdicionarCreditoView, PersonalizacaoEmpresaView

urlpatterns = [
    path('minha/', MinhaEmpresaView.as_view(),       name='minha_empresa'),
    path('minha/personalizacao/', PersonalizacaoEmpresaView.as_view(), name='personalizacao'),
    path('<uuid:empresa_public_id>/creditos/', AdicionarCreditoView.as_view(),   name='adicionar_credito'),
]