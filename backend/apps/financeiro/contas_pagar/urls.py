# apps/financeiro/contas_pagar/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContaPagarViewSet, ParcelaContaPagarViewSet

router = DefaultRouter()
router.register("contas-pagar",   ContaPagarViewSet,       basename="conta-pagar")
router.register("parcelas-pagar", ParcelaContaPagarViewSet, basename="parcela-pagar")

urlpatterns = [path("", include(router.urls))]