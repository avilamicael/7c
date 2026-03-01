# apps/core/audit.py
from apps.core.models import AuditLog
from apps.core.utils import get_empresa_do_membro

def registrar_log(*, request, acao, modulo, objeto, payload=None):

    empresa = get_empresa_do_membro(request)
    ip = request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR"))
    if ip and "," in ip:
        ip = ip.split(",")[0].strip()

    AuditLog.objects.create(
        empresa=empresa,
        usuario=request.user,
        acao=acao,
        modulo=modulo,
        objeto_tipo=objeto.__class__.__name__,
        objeto_id=objeto.pk,
        objeto_repr=str(objeto),
        payload=payload or {},
        ip=ip,
    )