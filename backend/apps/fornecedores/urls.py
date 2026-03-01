from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FornecedorViewSet

router = DefaultRouter()
router.register("fornecedores", FornecedorViewSet, basename="fornecedor")

urlpatterns = [
    path("", include(router.urls)),
]