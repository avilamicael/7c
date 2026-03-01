# Changelog — Backend

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