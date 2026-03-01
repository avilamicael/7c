# apps/financeiro/contas_receber/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContaReceberViewSet, ParcelaContaReceberViewSet

router = DefaultRouter()
router.register("contas-receber",   ContaReceberViewSet,       basename="conta-receber")
router.register("parcelas-receber", ParcelaContaReceberViewSet, basename="parcela-receber")

urlpatterns = [path("", include(router.urls))]