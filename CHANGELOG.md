# Changelog — Backend

---

## [v2.3.0] — 2026-03-04

### Alterações
- Redesenho completo dos modais de fornecedores (criar/editar) seguindo padrão visual dos modais de clientes
- Removidas tabs e ScrollArea separado; substituídos por scroll único no `DialogContent`
- Layout migrado para grid de 2 colunas (`grid-cols-2 gap-4`) em todos os campos
- Seções separadas por `border-b pb-1` com espaçamento `space-y-6 py-2`
- Campos CNPJ/CPF e Tipo tornam-se inputs desabilitados (`bg-muted`) no modal de edição
- Integração CEP via ViaCEP mantida (onBlur + botão Buscar)
- Componentização mantida em 4 arquivos com separação de responsabilidades

### Arquivos modificados
- `src/components/configuracoes/fornecedores/fornecedor-form-fields.jsx`
- `src/components/configuracoes/fornecedores/criar-fornecedor-dialog.jsx`
- `src/components/configuracoes/fornecedores/editar-fornecedor-dialog.jsx`

### Impacto
- Segurança: Sem alterações — validações e permissões mantidas
- Performance: Remoção de tabs elimina renderização condicional de painéis; sem ScrollArea aninhado reduz overhead de layout

---

## [v2.2.0] — 2026-03-03

### Alterações
- Adicionado modal de nova conta a pagar com tabs **Manual | Recorrência**, largura aumentada para `max-w-5xl`, data de competência preenchida automaticamente com a data atual e campo de desconto removido do cadastro
- Implementado modo de recorrência com tipos diária, semanal, quinzenal, mensal, bimestral, trimestral, semestral e anual, com pré-visualização em tempo real das parcelas geradas
- Corrigido layout dos selects no modal para ocupar largura total (`w-full`)
- Criado `src/lib/financeiro.api.js` com funções para `contasPagarApi`, `parcelasPagarApi`, `contasReceberApi`, `parcelasReceberApi`, `categoriasApi` e `contasBancariasApi`
- Criado `src/lib/fornecedores.api.js` com funções para `fornecedoresApi`
- Corrigido `apps/fornecedores/urls.py`: `router.register("fornecedores", ...)` alterado para `router.register("", ...)` eliminando a rota duplicada `/api/fornecedores/fornecedores/`
- Criada página `src/pages/configuracoes.jsx` com layout de nav lateral fixo à esquerda e conteúdo ocupando todo o espaço restante
- Criados componentes `categorias-section.jsx`, `contas-bancarias-section.jsx`, `link-captacao-section.jsx` e `personalizacao-section.jsx` em `src/components/configuracoes/`
- Adicionada rota `/configuracoes` no `src/App.jsx`
- Adicionado link "Configurações" no `NavSecondary` do `src/components/app-sidebar.jsx`
- Removidas `PersonalizacaoSection` e Link de Captação do `profile-content.jsx`, concentrando essas configurações na página de Configurações

### Arquivos modificados
- `src/components/financeiro/edit-conta-pagar-modal.jsx`
- `src/lib/financeiro.api.js` *(novo)*
- `src/lib/fornecedores.api.js` *(novo)*
- `apps/fornecedores/urls.py`
- `src/pages/configuracoes.jsx` *(novo)*
- `src/components/configuracoes/categorias-section.jsx` *(novo)*
- `src/components/configuracoes/contas-bancarias-section.jsx` *(novo)*
- `src/components/configuracoes/link-captacao-section.jsx` *(novo)*
- `src/components/configuracoes/personalizacao-section.jsx` *(novo)*
- `src/App.jsx`
- `src/components/app-sidebar.jsx`
- `src/components/profile-page/profile-content.jsx`

### Impacto
- Segurança: URLs de fornecedores corrigidas eliminam exposição de rotas duplicadas; nenhum dado sensível exposto
- Performance: `handle()` normaliza arrays evitando erros de `.map()` em respostas paginadas; modal de recorrência calcula parcelas localmente sem chamadas extras à API

## [v2.1] — 2026-03-03

### Alterações
- Criação do módulo financeiro completo com abas "Contas a Pagar" e "Contas a Receber"
- Implementação dos componentes `ContasPagarTab` e `ContasReceberTab` com filtros, tabela e KPIs
- Implementação do `KPICards` com cards de Total Pendente, Total Vencido, Total Pago/Recebido no Mês e Total de Contas
- Implementação dos modais `DetalhesContaPagarModal`, `DetalhesContaReceberModal`, `EditContaPagarModal` e `EditContaReceberModal`
- Substituição do `index.css` para adotar o tema do projeto Next.js (paleta azul-slate oklch, radius 0.5rem)
- Adição das fontes Inter e JetBrains Mono via Google Fonts no `index.html`
- Ajustes de design: tab full-width com ícones `TrendingUp`/`TrendingDown`, filtros em linha, `DatePicker` nos campos de data, badges de status com cores suaves

### Arquivos modificados
- `src/pages/financeiro.jsx`
- `src/components/financeiro/contas-pagar-tab.jsx`
- `src/components/financeiro/contas-receber-tab.jsx`
- `src/components/financeiro/kpi-cards.jsx`
- `src/components/financeiro/detalhes-conta-pagar-modal.jsx`
- `src/components/financeiro/detalhes-conta-receber-modal.jsx`
- `src/components/financeiro/edit-conta-pagar-modal.jsx`
- `src/components/financeiro/edit-conta-receber-modal.jsx`
- `src/index.css`
- `index.html`

### Impacto
- Segurança: Nenhuma alteração em autenticação ou permissões; todos os endpoints continuam protegidos via `authHeaders()`
- Performance: Filtros aplicados client-side com `useMemo`; KPIs calculados a partir dos dados já carregados sem requisições adicionais

## [v2] — 2026-03-02

### Alterações
- Conectada página `clientes.jsx` à API real, removendo mock data
- `isAdmin` derivado de `usuario?.role` via `useAuth()` em vez de hardcoded
- Adicionado refresh automático de token JWT em `api.js` — retenta request após renovar access token; redireciona para `/login` se refresh expirado
- `useAuth.js` agora redireciona para `/login` ao falhar, limpando tokens do localStorage
- `ClienteListSerializer` expandido com campos `cpf`, `telefone_principal`, `passaporte` e `data_nascimento` via `SerializerMethodField`
- Adicionado `prefetch_related('documentos', 'telefones')` em `ListarClientesView` para evitar N+1
- `ClienteSerializer` reescrito com suporte a escrita nested de `documentos` e `telefones` via `_sync_documentos` e `_sync_telefones`
- `InativarClienteView` corrigido para alternar `ativo`/`inativo` em vez de só inativar
- `dialog-editar.jsx` refatorado para buscar detalhe completo via `clientesApi.detalhar()` ao abrir, evitando tela branca por dados incompletos
- `dialog-criar.jsx` conectado à API com loading state e tratamento de erro
- `clientes-table.jsx` passou a gerenciar fetch internamente com `fetchClientes`, recarregando a lista após criar, editar ou inativar
- `clientes-form-steps.jsx` corrigido: tipo `"emergencia"` substituído por `"outro"` para alinhar com choices do backend; adicionado `CNH` nos tipos de documento
- `clientes-columns.jsx` atualizado para consumir `cpf` e `telefone_principal` direto do serializer em vez de `.find()` nos arrays

### Arquivos modificados
- `src/lib/api.js`
- `src/hooks/useAuth.js`
- `src/pages/clientes.jsx`
- `src/components/clientes/clientes-table.jsx`
- `src/components/clientes/clientes-columns.jsx`
- `src/components/clientes/clientes-form-steps.jsx`
- `src/components/clientes/dialog-criar.jsx`
- `src/components/clientes/dialog-editar.jsx`
- `apps/clientes/serializers.py`
- `apps/clientes/views.py`

### Impacto
- Segurança: refresh automático evita sessões quebradas com token expirado; redirect para login ao invés de estado indefinido
- Performance: `prefetch_related` elimina N+1 na listagem de clientes; fetch de detalhe sob demanda evita payload desnecessário na listagem

## [v1.12] — 2026-03-01

### Alterações
- Adicionado proxy `/media` no `vite.config.js` para servir arquivos de mídia via Vite em desenvolvimento
- Corrigido `get_avatar_url` no `UsuarioSerializer` para retornar path relativo (`obj.avatar.url`) em vez de URL absoluta com host interno do Docker
- Corrigido `dashboard.jsx` e `clientes.jsx` para passar `usuario` e `empresa` ao `AppSidebar` via `useAuth()`
- `isAdmin` em `clientes.jsx` agora derivado de `usuario?.role` em vez de hardcoded `true`
- Adicionado `profile-header.jsx`: preview de avatar antes de salvar, botão "Atualizar foto" separado do seletor, display name "Administrador" para role `admin`, `membroDesde` via `date_joined`
- Adicionado campos de endereço (`cep`, `endereco`, `cidade`, `uf`) no `PersonalTab` com busca automática via ViaCEP
- Criado `src/lib/cep.api.js` com função `buscarCep()` reutilizável
- Atualizado `apps/usuarios/admin.py` com fieldset "Endereço", `sobrenome` e `cidade` no `list_display`, filtro por `uf`

### Arquivos modificados
- `vite.config.js`
- `apps/usuarios/serializers.py`
- `src/pages/dashboard.jsx`
- `src/pages/clientes.jsx`
- `src/components/profile-page/profile-header.jsx`
- `src/components/profile-page/profile-content.jsx` (`PersonalTab`)
- `src/lib/cep.api.js`
- `apps/usuarios/admin.py`

### Impacto
- Segurança: nenhuma alteração de superfície de ataque; avatar_url não expõe mais host interno
- Performance: preview de avatar via `URL.createObjectURL` sem requisição extra ao servidor

## [v1.11] — 2026-03-01

### Alterações
- `apps/usuarios/models.py`: adicionados campos `sobrenome`, `endereco`, `cidade`, `uf` e `avatar` (`ImageField` com upload para `avatars/%Y/%m/`); adicionado `cep` com validador `validar_cep`
- `apps/usuarios/serializers.py`: criados `UsuarioSerializer` (com `role` e `avatar_url` via `SerializerMethodField`), `AtualizarPerfilSerializer`, `AvatarSerializer` (validação de formato e tamanho), `AlterarSenhaSerializer` (valida `senha_atual`, `nova_senha` e `confirmar_nova_senha` com `validate_password` do Django)
- `apps/usuarios/views.py`: criadas `MeuPerfilView` (GET/PATCH), `AtualizarAvatarView` (PATCH multipart, deleta avatar anterior), `AlterarSenhaView` (POST com throttle), `CriarUsuarioView`, `ListarUsuariosView`, `DesativarUsuarioView`; `LoginView` com `handle_exception` retornando 401 padronizado
- `apps/usuarios/urls.py`: rotas reescritas sem prefixo redundante — `login/`, `refresh/`, `logout/`, `me/`, `me/avatar/`, `me/senha/`, `criar/`, `<uuid>/desativar/`
- `core/urls.py`: adicionado `path('api/usuarios/', include('apps.usuarios.urls'))` para expor endpoints de perfil; mantido `api/auth/` para login e refresh
- `core/settings.py`: adicionados `MEDIA_URL = "/media/"` e `MEDIA_ROOT = DATA_DIR / "media"`
- `src/lib/api.js`: `request()` detecta `FormData` automaticamente e omite `Content-Type` para não quebrar upload com boundary
- `src/lib/usuarios.api.js`: adicionados métodos `meuPerfil()`, `atualizarPerfil()`, `atualizarAvatar()` e `alterarSenha()`; todos retornam JSON parseado e lançam erro em caso de resposta não-ok
- `src/lib/empresas.api.js`: todos os métodos agora retornam `.json()` parseado em vez de `Response` bruta
- `src/hooks/useAuth.js`: criado hook com `meuPerfil()` e `buscar()` em paralelo via `Promise.all`; expõe `usuario`, `empresa`, `loading` e `recarregar`
- `src/components/app-sidebar.jsx`: recebe props `usuario` e `empresa`; nome e logo da empresa dinâmicos; `NavUser` alimentado com dados reais do usuário autenticado; arrays de navegação movidos para constantes fora do componente
- `src/components/profile-page/profile-header.jsx`: exibe avatar real, iniciais dinâmicas, role, email, cidade+UF e membro desde; upload de avatar via `atualizarAvatar()`
- `src/components/profile-page/profile-content.jsx`: aba Pessoal integrada com `atualizarPerfil()`; aba Conta exibe planos fictícios apenas para admin; aba Segurança com formulário de 3 campos integrado a `alterarSenha()`; 2FA e Notificações em modo readonly com badge "Em breve"
- `src/pages/profile.jsx`: conectado ao `useAuth`; passa `usuario` e `empresa` para `AppSidebar`, `ProfileHeader` e `ProfileContent`

### Arquivos modificados
- `apps/usuarios/models.py`
- `apps/usuarios/serializers.py`
- `apps/usuarios/views.py`
- `apps/usuarios/urls.py`
- `core/urls.py`
- `core/settings.py`
- `src/lib/api.js`
- `src/lib/usuarios.api.js`
- `src/lib/empresas.api.js`
- `src/hooks/useAuth.js`
- `src/components/app-sidebar.jsx`
- `src/components/profile-page/profile-header.jsx`
- `src/components/profile-page/profile-content.jsx`
- `src/pages/profile.jsx`

### Impacto
- Segurança: avatar servido via `MEDIA_URL` protegido por autenticação JWT; upload valida content-type e tamanho antes de salvar; avatar anterior deletado do disco ao substituir; `AlterarSenhaSerializer` valida senha atual antes de permitir troca; plano de assinatura exposto apenas para role admin
- Performance: `Promise.all` no `useAuth` paraleliza as duas chamadas de perfil; arrays de navegação do sidebar são constantes estáticas (sem re-criação a cada render); `update_fields` mantido em todos os saves parciais

## [v1.10] — 2026-03-01

### Alterações
- `apps/kanban/views.py`: corrigido import de `IsAdminEmpresa` e `IsMembroEmpresa` — era `apps.usuarios.permissions`, passou a ser `apps.core.permissions`
- `apps/usuarios/views.py`: adicionado `handle_exception()` em `LoginView` para retornar `{"detail": "E-mail ou senha inválidos."}` com status 401 em vez de resposta vazia ao errar credenciais
- `frontend/src/lib/api.js`: criado cliente HTTP centralizado com função `request()` base e módulo `authApi` com métodos `login()`, `refresh()` e `logout()`; tokens JWT lidos do `localStorage` no header `Authorization`
- `frontend/src/pages/login.jsx`: criada tela de login completa com layout two-column (branding + formulário), campos de e-mail e senha com ícones, toggle de visibilidade da senha, tratamento de erros via toast para credenciais inválidas, rate limit e erro de conexão, redirecionamento pós-login via `useNavigate` e integração com `authApi.login()`
- `frontend/src/components/private-route.jsx`: criado componente de proteção de rotas — redireciona para `/login` se `access` token ausente no `localStorage`; envolve todas as rotas privadas no `App.jsx`
- `frontend/src/App.jsx`: rotas `/`, `/clientes` e `/configuracoes` protegidas com `<PrivateRoute>`; adicionado `<Toaster richColors position="bottom-right" />` para notificações toast globais

### Arquivos modificados
- `apps/kanban/views.py`
- `apps/usuarios/views.py`
- `frontend/src/lib/api.js`
- `frontend/src/pages/login.jsx`
- `frontend/src/components/private-route.jsx`
- `frontend/src/App.jsx`

### Impacto
- Segurança: rotas privadas bloqueadas no frontend sem token; resposta de erro de login padronizada evita leak de existência de usuário; tokens armazenados em `localStorage` e enviados via `Authorization: Bearer`
- Performance: cliente HTTP centralizado elimina duplicação de headers e lógica de fetch em cada chamada

## [v1.9] — 2026-03-01

### Alterações
- `apps/kanban/models.py`: adicionado modelo `KanbanColunaAcao` com tipos `ALTERAR_STATUS_TAREFA`, `ALTERAR_PRIORIDADE`, `NOTIFICAR_RESPONSAVEL` e `NOTIFICAR_EMPRESA`; campo `parametro` guarda o valor da ação (ex: `"CONCLUIDA"`, `"URGENTE"`); `PARAMETROS_VALIDOS` no model centraliza validação por tipo; `UniqueConstraint` em `(coluna, tipo)` impede duplicatas
- `apps/kanban/models.py`: adicionado `GenericRelation` para `Notificacao` em `KanbanCard`
- `apps/tarefas/models.py`: criado modelo `Tarefa` com `OneToOneField` opcional para `KanbanCard`; campos `lembrete_em` e `lembrete_notificado` para controle do Celery beat; `GenericRelation` para `Notificacao`

### Arquivos modificados
- `apps/kanban/models.py`
- `apps/tarefas/models.py`

### Impacto
- Segurança: `UniqueConstraint` em `KanbanColunaAcao` impede configurações duplicadas por coluna
- Performance: índice em `(lembrete_em, lembrete_notificado)` otimiza query do Celery beat; `OneToOneField` no card permite lookup direto `card.tarefa` sem query extra

## [v1.8] — 2026-03-01

### Alterações
- `apps/core/models.py`: adicionados modelos `Notificacao` e `NotificacaoDestinatario`; `Notificacao` usa `GenericForeignKey` para referenciar qualquer model do sistema como origem; `NotificacaoDestinatario` isola entrega por usuário e canal com controle de `status`, `lida`, `tentativas` e `data_leitura`; `UniqueConstraint` em `(notificacao, usuario, canal)` evita duplicatas
- `apps/core/services.py`: criado `NotificacaoService` com funções explícitas por evento — `tarefa_atribuida`, `tarefa_concluida`, `tarefa_lembrete`, `tarefa_reagendada` e `card_movido`; despacho para Celery via import lazy em `_despachar()` evitando circular import
- `apps/core/tasks.py`: criada task `entregar_notificacao` com retry automático (max 3, delay 60s); worker WEB envia via WebSocket usando `async_to_sync`; criada task `processar_lembretes` para Celery beat (a cada 5min) buscando tarefas com `lembrete_em <= agora` e `lembrete_notificado=False`
- `apps/core/consumers.py`: criado `NotificacaoConsumer` (AsyncWebsocketConsumer); ao conectar envia as 50 últimas não lidas; aceita ações `marcar_lida` e `marcar_todas_lidas` do frontend; handler `notificacao_nova` recebe eventos do Celery via `group_send`
- `apps/core/routing.py`: adicionada rota `ws/notificacoes/` apontando para `NotificacaoConsumer`
- `apps/core/utils.py`: adicionada função `get_membros_empresa(empresa)` retornando `QuerySet` de `usuario_id` dos membros ativos via `values_list("usuario_id", flat=True)`
- `core/celery.py`: criado com `autodiscover_tasks` e beat schedule para `processar_lembretes` a cada 5min
- `core/__init__.py`: expõe `celery_app` para que Django carregue o Celery no boot
- `core/settings.py`: adicionados `django_celery_beat`, `django_celery_results` em `INSTALLED_APPS`; adicionadas configurações `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`, `CELERY_TIMEZONE`, `CELERY_BEAT_SCHEDULER`
- `docker-compose.yml`: adicionados serviços `celery_worker` e `celery_beat` com `build: ./backend`, `restart: always` e healthcheck nas dependências

### Arquivos modificados
- `apps/core/models.py`
- `apps/core/services.py`
- `apps/core/tasks.py`
- `apps/core/consumers.py`
- `apps/core/routing.py`
- `apps/core/utils.py`
- `core/celery.py`
- `core/__init__.py`
- `core/settings.py`
- `docker-compose.yml`

### Impacto
- Segurança: WebSocket autenticado via JWT já existente; `marcar_lida` valida `usuario_id` no filtro impedindo que um usuário marque notificação de outro; `bulk_create` com `ignore_conflicts=True` respeita `UniqueConstraint` sem expor erro ao cliente
- Performance: `bulk_create` para `NotificacaoDestinatario` evita N queries ao notificar empresa inteira; entrega assíncrona via Celery não bloqueia a request; beat busca apenas tarefas com `lembrete_notificado=False` evitando reprocessamento

---

## [v1.7] — 2026-03-01

### Alterações
- `apps/kanban/serializers.py`: criados `KanbanBoardSerializer` (leitura com colunas aninhadas), `KanbanBoardWriteSerializer`, `KanbanColunaSerializer`, `KanbanColunaWriteSerializer` e `KanbanCardSerializer`; `KanbanCardSerializer` valida pertencimento da `coluna` e do `responsavel` ao escopo da empresa via `context["empresa"]`
- `apps/kanban/views.py`: criados `KanbanBoardViewSet`, `KanbanColunaViewSet` e `KanbanCardViewSet`; boards e colunas exigem `IsAdminEmpresa` para write (create/update/destroy), membro pode apenas listar/detalhar; cards permitem write para qualquer membro; criação de board valida `limite_boards` da empresa antes de persistir; empresa cacheada em `self._empresa` via `hasattr` eliminando query duplicada por request
- `apps/kanban/urls.py`: rotas `api/kanban/boards/`, `api/kanban/boards/<uuid>/colunas/` e `api/kanban/cards/` registradas com `lookup_field = "public_id"`
- `core/urls.py`: adicionada rota `api/kanban/` apontando para `apps.kanban.urls`
- `api-documentation.docx`: atualizado para v1.7; adicionada seção 10 (Kanban) com tabelas de endpoints e bodies para Boards, Colunas e Cards

### Arquivos modificados
- `apps/kanban/serializers.py`
- `apps/kanban/views.py`
- `apps/kanban/urls.py`
- `core/urls.py`
- `api-documentation.docx`

### Impacto
- Segurança: escopo de empresa isolado em todos os endpoints kanban; coluna e responsável validados contra empresa no serializer; `IsAdminEmpresa` verificado explicitamente nos métodos write de board e coluna — operadores não conseguem criar/editar estrutura do board
- Performance: empresa cacheada em `self._empresa` por request; cards carregados com `select_related("coluna", "responsavel", "criado_por")` evitando N+1; boards listados com `prefetch_related("colunas")`

## [v1.6] — 2026-03-01

### Alterações
- `apps/core/models.py`: criado modelo `AuditLog` genérico com campos `empresa`, `usuario`, `acao`, `modulo`, `objeto_tipo`, `objeto_id`, `objeto_repr`, `payload`, `ip` e `data`; índices em `(empresa, -data)`, `(modulo, objeto_tipo, objeto_id)` e `(usuario, -data)`
- `apps/core/audit.py`: criado utilitário `registrar_log()` centralizando gravação de auditoria com extração de IP via `HTTP_X_FORWARDED_FOR`
- `apps/core/apps.py`: criado `CoreConfig` com `default_auto_field`
- `apps/kanban/models.py`: criados modelos `KanbanBoard`, `KanbanColuna` e `KanbanCard`; `KanbanCardMovimento` descartado em favor do `AuditLog`; `unique_together` em `posicao` removido — unicidade controlada na camada de aplicação
- `apps/empresas/models.py`: adicionado campo `limite_boards` (`PositiveIntegerField`, default=1) para controle futuro de cobrança por board

### Arquivos modificados
- `apps/core/models.py`
- `apps/core/audit.py`
- `apps/core/apps.py`
- `apps/kanban/models.py`
- `apps/empresas/models.py`

### Impacto
- Segurança: auditoria centralizada cobre todos os módulos; IP registrado por ação; escopo de empresa isolado em todos os modelos kanban
- Performance: índices compostos no `AuditLog` para queries por empresa, módulo e usuário; `select_related` será aplicado nas views

## [v1.5] — 2026-03-01

### Alterações
- `core/asgi.py`: migrado de WSGI puro para `ProtocolTypeRouter` com suporte a HTTP e WebSocket
- `apps/core/middleware.py`: criado `JwtAuthMiddleware` para autenticação WebSocket via JWT na query string
- `apps/core/routing.py`: criado arquivo de rotas WebSocket (vazio, aguardando consumers)
- `core/settings.py`: adicionados `channels`, `apps.core` em `INSTALLED_APPS`; adicionadas configurações `ASGI_APPLICATION` e `CHANNEL_LAYERS` apontando para Redis
- `requirements.txt`: adicionados `channels==4.1.0`, `channels-redis==4.2.0`, `daphne`
- `Dockerfile`: `CMD` atualizado de `gunicorn` para `daphne`
- `docker-compose.yml`: `command` do serviço `backend` atualizado de `gunicorn` para `daphne -b 0.0.0.0 -p 8000 core.asgi:application`
- `nginx.conf`: adicionado bloco `location /ws/` com headers `Upgrade` e `Connection` para suporte a WebSocket; `proxy_read_timeout 86400` para manter conexões persistentes

### Arquivos modificados
- `core/asgi.py`
- `core/settings.py`
- `requirements.txt`
- `Dockerfile`
- `docker-compose.yml`
- `nginx.conf`
- `apps/core/middleware.py`
- `apps/core/routing.py`

### Impacto
- Segurança: conexões WebSocket autenticadas via JWT no handshake; `AllowedHostsOriginValidator` rejeita origens não autorizadas
- Performance: Redis já existente reutilizado como channel layer; sem overhead adicional nas rotas HTTP existentes

## [v1.4.1] — 2026-02-28

### Alterações
- `apps/financeiro/shared/models.py`: `FormaPagamento` extraída como `TextChoices` standalone, eliminando definição duplicada em `ContaPagar` e `ContaReceber`
- `apps/financeiro/shared/models.py`: `RecalcularStatusMixin` criado como model abstrato com lógica de recálculo de status parametrizada — elimina duplicação entre `ContaPagar` e `ContaReceber`
- `apps/financeiro/shared/serializers.py`: `RegistrarMovimentoBaseSerializer` adicionado com campos, validações e `_aplicar_campos_comuns()` compartilhados
- `apps/financeiro/shared/serializers.py`: `BaixaBaseSerializer` adicionado com `_realizar_baixa()` centralizando lógica de baixa/cancelamento
- `apps/financeiro/shared/views.py`: `EmpresaScopedViewSet` adicionado como base — cacheia `_empresa` no `self` via `hasattr`, eliminando dupla chamada a `get_empresa_do_membro()` por request
- `apps/financeiro/contas_pagar/models.py`: `FormaPagamento` local removida; `ContaPagar` passa a herdar `RecalcularStatusMixin`; `recalcular_status()` simplificado para delegar ao mixin
- `apps/financeiro/contas_receber/models.py`: idem ao `contas_pagar` — `FormaPagamento` local removida; `ContaReceber` herda `RecalcularStatusMixin`
- `apps/financeiro/contas_pagar/serializers.py`: `RegistrarPagamentoSerializer` refatorado para herdar `RegistrarMovimentoBaseSerializer`; `BaixaContaPagarSerializer` refatorado para herdar `BaixaBaseSerializer`
- `apps/financeiro/contas_receber/serializers.py`: idem — `RegistrarRecebimentoSerializer` e `BaixaContaReceberSerializer` usando classes base do shared
- `apps/financeiro/contas_pagar/views.py`: `get_empresa()` com cache via `hasattr(self, "_empresa")` em `ContaPagarViewSet`
- `apps/financeiro/contas_receber/views.py`: idem em `ContaReceberViewSet`

### Arquivos modificados
- `apps/financeiro/shared/models.py`
- `apps/financeiro/shared/serializers.py`
- `apps/financeiro/shared/views.py`
- `apps/financeiro/contas_pagar/models.py`
- `apps/financeiro/contas_pagar/serializers.py`
- `apps/financeiro/contas_pagar/views.py`
- `apps/financeiro/contas_receber/models.py`
- `apps/financeiro/contas_receber/serializers.py`
- `apps/financeiro/contas_receber/views.py`

### Impacto
- Segurança: sem impacto direto; lógica de escopo de empresa mantida e centralizada
- Performance: eliminada query duplicada a `get_empresa_do_membro()` por request nos ViewSets via cache em `self._empresa`; lógica de `recalcular_status()` e `_realizar_baixa()` centralizadas sem overhead adicional

## [v1.4] — 2026-02-28

### Alterações
- Reestruturado `apps.financeiro` em subapps: `shared`, `contas_pagar`, `contas_receber`
- `apps/financeiro/shared/models.py`: modelos `Categoria` e `ContaBancaria` extraídos para módulo compartilhado
- `apps/financeiro/shared/serializers.py`: `CategoriaSerializer` e `ContaBancariaSerializer`
- `apps/financeiro/shared/views.py`: `CategoriaViewSet` e `ContaBancariaViewSet` com escopo por empresa
- `apps/financeiro/shared/urls.py`: rotas `categorias/` e `contas-bancarias/`
- `apps/financeiro/contas_pagar/`: implementação completa — `ContaPagar`, `ParcelaContaPagar`, `NotaFiscalCP`, `BaixaContaPagar` com serializers, views e urls
- `apps/financeiro/contas_receber/`: implementação completa — `ContaReceber`, `ParcelaContaReceber`, `BaixaContaReceber` com serializers, views e urls
- `apps/financeiro/signals.py`: signals `post_save` para recálculo automático de status em `ParcelaContaPagar` e `ParcelaContaReceber`
- `apps/financeiro/urls.py`: agregador das rotas dos três submodulos
- `apps/financeiro/apps.py`: `ready()` registra signals automaticamente

### Arquivos modificados
- `apps/financeiro/apps.py`
- `apps/financeiro/urls.py`
- `apps/financeiro/signals.py`
- `apps/financeiro/shared/models.py`
- `apps/financeiro/shared/serializers.py`
- `apps/financeiro/shared/views.py`
- `apps/financeiro/shared/urls.py`
- `apps/financeiro/contas_pagar/models.py`
- `apps/financeiro/contas_pagar/serializers.py`
- `apps/financeiro/contas_pagar/views.py`
- `apps/financeiro/contas_pagar/urls.py`
- `apps/financeiro/contas_receber/models.py`
- `apps/financeiro/contas_receber/serializers.py`
- `apps/financeiro/contas_receber/views.py`
- `apps/financeiro/contas_receber/urls.py`

### Impacto
- Segurança: escopo de empresa validado em todos os endpoints via `get_empresa_do_membro()`; validação de pertencimento (fornecedor, cliente, categoria) nos serializers de escrita
- Performance: `select_related` e `prefetch_related` aplicados em todos os ViewSets; recálculo de status via `update()` sem recarregar instância; signal centralizado evita lógica duplicada

## [v1.3] — 2026-02-28

### Alterações
- Integração de `apps.fornecedores` ao padrão do projeto: substituído `request.user.empresa_ativa` por `get_empresa_do_membro()` em `views.py`
- Corrigido import de `validar_cnpj` e `validar_cpf` em `apps/fornecedores/serializers.py`: era `from core.validators`, passou a ser `from apps.core.validators`
- Registrado `apps.fornecedores` e `apps.financeiro` em `INSTALLED_APPS`
- Adicionadas rotas `api/fornecedores/` e `api/financeiro/` em `core/urls.py`
- Integração de `apps.financeiro` ao padrão do projeto: substituído `request.user.empresa_ativa` e `request.user.empresa_ativa_id` por `get_empresa_do_membro()` em `views.py` e `serializers.py`
- `EmpresaQuerysetMixin` refatorado: removido `empresa_field` genérico, centralizado em `get_empresa()` usando `get_empresa_do_membro()`
- `ContaPagarViewSet`: adicionado `lookup_field = "public_id"` e corrigido `self.kwargs["pk"]` para `self.kwargs["public_id"]` em `get_object()`
- Removido comentário incorreto em `apps/usuarios/apps.py`

### Arquivos modificados
- `apps/fornecedores/serializers.py`
- `apps/fornecedores/views.py`
- `apps/financeiro/serializers.py`
- `apps/financeiro/views.py`
- `core/settings.py`
- `core/urls.py`
- `apps/usuarios/apps.py`

### Impacto
- Segurança: eliminado acesso a atributo inexistente `empresa_ativa` que causaria `AttributeError` em runtime; escopo de empresa agora consistente em todos os módulos via `get_empresa_do_membro()`
- Performance: acesso à empresa via `user.empresa_vinculo` (OneToOne) sem query extra, mantido em todos os novos módulos

---

## [1.2] — 2026-02-28

### Alterações
- `core/urls.py`: removida duplicação de `apps.usuarios.urls` — `api/usuarios/` eliminado, rotas consolidadas em `api/auth/`
- `apps/core/utils.py`: arquivo criado com `get_empresa_do_admin()` e `get_empresa_do_membro()` centralizadas
- `apps/empresas/views.py`: import de `get_empresa_do_admin` corrigido para `apps.core.utils` (era `apps.usuarios.views`)

### Arquivos modificados
- `core/urls.py`
- `apps/core/utils.py`
- `apps/empresas/views.py`

### Impacto
- Segurança: eliminada dependência circular entre apps. Lógica de acesso centralizada facilita auditorias futuras
- Performance: sem impacto direto. Rotas duplicadas eliminadas reduzem superfície de requisições desnecessárias

---

## [1.1] — 2026-02-28

### Alterações
- `[ALTA]` `LoginView` movida de `urls.py` para `views.py` com `throttle_classes = [LoginRateThrottle]` aplicado corretamente
- `[ALTA]` `apps.clientes` registrada em `INSTALLED_APPS`. Migrations executadas
- `[MÉDIA]` `get_empresa_do_admin()` protegida com `try/except` — lança `PermissionDenied` (403) em vez de `DoesNotExist` (500)
- `[MÉDIA]` Validador de CNPJ implementado com verificação de dígitos verificadores
- `[MÉDIA]` Validador de telefone implementado — aceita apenas 10 ou 11 dígitos numéricos
- `[BAIXA]` `ClienteDocumento`: choices `CPF`, `RG`, `CNH`, `OUTRO` + campo `tipo_outro` obrigatório quando `tipo=OUTRO`
- `[BAIXA]` `ClienteTelefone`: choice `EMERGENCIA` renomeado para `OUTRO`. Campo `nome` obrigatório quando `tipo=OUTRO`
- `[BAIXA]` Validador de cor hex implementado — aceita apenas formato `#RRGGBB`
- `UsuarioEmpresa` refatorado: `ForeignKey` trocado por `OneToOneField` — um usuário pertence a uma única empresa. `unique_together` removido
- Funções `get_empresa_do_admin()` e `get_empresa_do_membro()` centralizadas em `apps/core/utils.py`
- `apps.clientes`: serializers, views e urls implementados (`Cliente`, `ClienteDocumento`, `ClienteTelefone`)

### Arquivos modificados
- `apps/usuarios/views.py`
- `apps/usuarios/urls.py`
- `apps/empresas/models.py`
- `apps/clientes/models.py`
- `apps/clientes/serializers.py`
- `apps/clientes/views.py`
- `apps/clientes/urls.py`
- `apps/core/utils.py`
- `apps/core/validators.py`
- `core/urls.py`
- `core/settings.py`

### Impacto
- Segurança: rate limit no login agora funciona efetivamente. Erros 500 por `DoesNotExist` eliminados. Escopo de empresa isolado por `OneToOneField` — impossível vazar dados entre empresas
- Performance: acesso a empresa via `user.empresa_vinculo` (OneToOne) elimina query extra. `select_related` e `prefetch_related` mantidos nas views de cliente