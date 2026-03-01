# Checklist — Kanban + Tarefas

## ✅ Etapa 1 — Infraestrutura WebSocket
- [x] Instalar `channels`, `channels-redis`, `daphne`
- [x] Configurar `core/asgi.py` com `ProtocolTypeRouter`
- [x] Criar `apps/core/middleware.py` com autenticação JWT via query string
- [x] Criar `apps/core/routing.py` (aguardando consumers)
- [x] Atualizar `core/settings.py` com `CHANNEL_LAYERS` e `ASGI_APPLICATION`
- [x] Trocar `gunicorn` por `daphne` no `Dockerfile` e `docker-compose.yml`
- [x] Configurar `nginx.conf` com bloco `/ws/`
- [x] Validar conexão WebSocket autenticada em ambiente Docker

---

## ⬜ Etapa 2 — Backend Kanban + Tarefas
- [ ] Definir arquitetura dos models
- [ ] `apps/kanban/models.py` — `KanbanBoard`, `KanbanColuna`, `KanbanCard`, `Tarefa`
- [ ] `apps/kanban/serializers.py`
- [ ] `apps/kanban/views.py`
- [ ] `apps/kanban/urls.py`
- [ ] `apps/kanban/consumers.py` — WebSocket consumer por empresa
- [ ] `apps/kanban/signals.py` — publicar eventos no channel após save
- [ ] `apps/notificacoes/models.py` — `Notificacao`
- [ ] `apps/notificacoes/serializers.py`
- [ ] `apps/notificacoes/views.py`
- [ ] `apps/notificacoes/urls.py`
- [ ] Atualizar `apps/core/routing.py` com rotas WebSocket do Kanban
- [ ] Migrations e testes

---

## ⬜ Etapa 3 — Frontend Kanban + Tarefas
- [ ] Instalar `@dnd-kit/core` e `@fullcalendar/react`
- [ ] `hooks/useKanbanSocket.js` — conexão WebSocket, recebe eventos, atualiza estado
- [ ] `hooks/useNotificacoes.js` — polling 30s
- [ ] `pages/kanban/KanbanPage.jsx`
- [ ] `pages/kanban/components/KanbanColuna.jsx`
- [ ] `pages/kanban/components/KanbanCard.jsx`
- [ ] `pages/kanban/components/CardModal.jsx` — detalhes + checklist de tarefas
- [ ] `pages/kanban/components/TarefaItem.jsx`
- [ ] `pages/calendario/CalendarioPage.jsx`
- [ ] `components/layout/NotificacaoBell.jsx`