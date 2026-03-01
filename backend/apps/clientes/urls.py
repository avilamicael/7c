from django.urls import path
from .views import (
    ListarClientesView,
    CriarClienteView,
    DetalharClienteView,
    EditarClienteView,
    InativarClienteView,
    ClienteDocumentoView,
    ClienteTelefoneView,
)

urlpatterns = [
    path('',                                    ListarClientesView.as_view(),  name='listar-clientes'),
    path('criar/',                              CriarClienteView.as_view(),    name='criar-cliente'),
    path('<uuid:public_id>/',                   DetalharClienteView.as_view(), name='detalhar-cliente'),
    path('<uuid:public_id>/editar/',            EditarClienteView.as_view(),   name='editar-cliente'),
    path('<uuid:public_id>/inativar/',          InativarClienteView.as_view(), name='inativar-cliente'),
    path('<uuid:public_id>/documentos/',        ClienteDocumentoView.as_view(), name='cliente-documentos'),
    path('<uuid:public_id>/telefones/',         ClienteTelefoneView.as_view(), name='cliente-telefones'),
]