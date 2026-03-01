# apps/financeiro/urls.py

from django.urls import path, include

urlpatterns = [
    path("", include("apps.financeiro.shared.urls")),
    path("", include("apps.financeiro.contas_pagar.urls")),
    path("", include("apps.financeiro.contas_receber.urls")),
]