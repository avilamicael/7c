from rest_framework.exceptions import PermissionDenied
from apps.empresas.models import UsuarioEmpresa


def get_empresa_do_membro(user):
    try:
        vinculo = user.empresa_vinculo
        if not vinculo.ativo:
            raise PermissionDenied()
        return vinculo.empresa
    except UsuarioEmpresa.DoesNotExist:
        raise PermissionDenied()


def get_empresa_do_admin(user):
    try:
        vinculo = user.empresa_vinculo
        if not vinculo.ativo or vinculo.role != UsuarioEmpresa.Role.ADMIN:
            raise PermissionDenied()
        return vinculo.empresa
    except UsuarioEmpresa.DoesNotExist:
        raise PermissionDenied()
    
def get_membros_empresa(empresa):
    return (
        UsuarioEmpresa.objects
        .filter(empresa=empresa, ativo=True)
        .values_list("usuario_id", flat=True)
    )