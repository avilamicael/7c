from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from apps.core.models import Notificacao, NotificacaoDestinatario
from apps.core.utils import get_membros_empresa


def _criar_destinatarios(notificacao, usuarios, canais=None):
    """
    Cria NotificacaoDestinatario em bulk.
    Por ora só WEB. Quando novos canais forem ativados,
    basta passar canais=[Canal.WEB, Canal.EMAIL].
    """
    if canais is None:
        canais = [NotificacaoDestinatario.Canal.WEB]

    destinatarios = [
        NotificacaoDestinatario(
            notificacao=notificacao,
            usuario_id=usuario_id,
            canal=canal,
        )
        for usuario_id in usuarios
        for canal in canais
    ]
    NotificacaoDestinatario.objects.bulk_create(
        destinatarios,
        ignore_conflicts=True,  # respeita o UniqueConstraint
    )
    return destinatarios


def _criar_notificacao(empresa, origem, tipo, payload):
    ct = ContentType.objects.get_for_model(origem)
    return Notificacao.objects.create(
        empresa=empresa,
        content_type=ct,
        object_id=origem.pk,
        tipo=tipo,
        payload=payload,
    )


# ──────────────────────────────────────────
# Notificações de Tarefa
# ──────────────────────────────────────────

def tarefa_atribuida(tarefa):
    """Notifica apenas o usuário que recebeu a tarefa."""
    notificacao = _criar_notificacao(
        empresa=tarefa.empresa,
        origem=tarefa,
        tipo=Notificacao.Tipo.TAREFA_ATRIBUIDA,
        payload={
            "tarefa_id": str(tarefa.public_id),
            "titulo": tarefa.titulo,
            "atribuido_por": tarefa.criado_por.nome,
            "prioridade": tarefa.prioridade,
            "vencimento": tarefa.data_vencimento.isoformat(),
        },
    )
    _criar_destinatarios(notificacao, [tarefa.atribuido_a_id])
    _despachar(notificacao)


def tarefa_concluida(tarefa):
    """Notifica o criador da tarefa (se diferente de quem concluiu)."""
    usuarios = {tarefa.criado_por_id}
    if tarefa.atribuido_a_id != tarefa.criado_por_id:
        usuarios.add(tarefa.atribuido_a_id)

    notificacao = _criar_notificacao(
        empresa=tarefa.empresa,
        origem=tarefa,
        tipo=Notificacao.Tipo.TAREFA_CONCLUIDA,
        payload={
            "tarefa_id": str(tarefa.public_id),
            "titulo": tarefa.titulo,
            "concluida_em": timezone.now().isoformat(),
        },
    )
    _criar_destinatarios(notificacao, list(usuarios))
    _despachar(notificacao)


def tarefa_lembrete(tarefa):
    """Notifica o responsável pela tarefa (disparado pelo Celery beat)."""
    notificacao = _criar_notificacao(
        empresa=tarefa.empresa,
        origem=tarefa,
        tipo=Notificacao.Tipo.TAREFA_LEMBRETE,
        payload={
            "tarefa_id": str(tarefa.public_id),
            "titulo": tarefa.titulo,
            "vencimento": tarefa.data_vencimento.isoformat(),
        },
    )
    _criar_destinatarios(notificacao, [tarefa.atribuido_a_id])
    _despachar(notificacao)


def tarefa_reagendada(tarefa, data_anterior):
    """Notifica o responsável quando a data de vencimento é alterada."""
    notificacao = _criar_notificacao(
        empresa=tarefa.empresa,
        origem=tarefa,
        tipo=Notificacao.Tipo.TAREFA_REAGENDADA,
        payload={
            "tarefa_id": str(tarefa.public_id),
            "titulo": tarefa.titulo,
            "data_anterior": data_anterior.isoformat(),
            "nova_data": tarefa.data_vencimento.isoformat(),
        },
    )
    _criar_destinatarios(notificacao, [tarefa.atribuido_a_id])
    _despachar(notificacao)


# ──────────────────────────────────────────
# Notificações de Kanban
# ──────────────────────────────────────────

def card_movido(card, coluna_anterior, movido_por):
    """Notifica todos os membros da empresa quando um card é movido."""
    empresa = card.coluna.board.empresa
    notificacao = _criar_notificacao(
        empresa=empresa,
        origem=card,
        tipo=Notificacao.Tipo.KANBAN_CARD_MOVIDO,
        payload={
            "card_id": str(card.public_id),
            "card_titulo": card.titulo,
            "coluna_anterior": coluna_anterior,
            "coluna_atual": card.coluna.nome,
            "movido_por": movido_por.nome,
        },
    )
    membros = get_membros_empresa(empresa)
    _criar_destinatarios(notificacao, list(membros))
    _despachar(notificacao)


# ──────────────────────────────────────────
# Despacho para Celery (importação lazy evita circular import)
# ──────────────────────────────────────────

def _despachar(notificacao):
    from apps.core.tasks import entregar_notificacao
    entregar_notificacao.delay(notificacao.pk)