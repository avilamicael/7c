# Changelog — Backend

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

