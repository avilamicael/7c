from rest_framework.permissions import BasePermission
from apps.empresas.models import UsuarioEmpresa


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_superuser


class IsAdminEmpresa(BasePermission):
    """Usuário com role admin em qualquer empresa ativa."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return UsuarioEmpresa.objects.filter(
            usuario=request.user,
            role=UsuarioEmpresa.Role.ADMIN,
            ativo=True
        ).exists()


class IsMembroEmpresa(BasePermission):
    """Qualquer usuário ativo vinculado a qualquer empresa."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and UsuarioEmpresa.objects.filter(
            usuario=request.user,
            ativo=True
        ).exists()