# apps/kanban/services.py

from apps.kanban.models import KanbanCard, KanbanColunaAcao


def executar_acoes_coluna(card: KanbanCard, coluna, movido_por=None, coluna_anterior_nome: str = "") -> None:
    """Executa as ações automáticas definidas em uma coluna ao receber um card."""
    acoes = list(coluna.acoes.select_related("coluna").all())

    for acao in acoes:
        if acao.tipo == KanbanColunaAcao.Tipo.ALTERAR_STATUS_TAREFA:
            _alterar_status_tarefa(card, acao.parametro)

        elif acao.tipo == KanbanColunaAcao.Tipo.ALTERAR_PRIORIDADE:
            _alterar_prioridade(card, acao.parametro)

        elif acao.tipo == KanbanColunaAcao.Tipo.NOTIFICAR_RESPONSAVEL:
            if card.responsavel_id and movido_por:
                from apps.core.services import card_movido
                card_movido(card, coluna_anterior_nome, movido_por)

        elif acao.tipo == KanbanColunaAcao.Tipo.NOTIFICAR_EMPRESA:
            if movido_por:
                from apps.core.services import card_movido
                card_movido(card, coluna_anterior_nome, movido_por)


def _alterar_status_tarefa(card: KanbanCard, novo_status: str) -> None:
    try:
        tarefa = card.tarefa
        tarefa._skip_card_sync = True
        tarefa.status = novo_status
        tarefa.save()
    except Exception:
        pass


def _alterar_prioridade(card: KanbanCard, nova_prioridade: str) -> None:
    KanbanCard.objects.filter(pk=card.pk).update(prioridade=nova_prioridade)
    try:
        from apps.tarefas.models import Tarefa
        Tarefa.objects.filter(card=card).update(prioridade=nova_prioridade)
    except Exception:
        pass
