# apps/financeiro/shared/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoriaViewSet, ContaBancariaViewSet

router = DefaultRouter()
router.register("categorias",       CategoriaViewSet,   basename="categoria")
router.register("contas-bancarias", ContaBancariaViewSet, basename="conta-bancaria")

urlpatterns = [path("", include(router.urls))]