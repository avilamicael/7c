# Documentação do Projeto — Django + React + Vite + Docker

## Visão Geral

Projeto fullstack SaaS multitenant com backend em Django (API REST) e frontend em React + Vite, servido por Nginx, com banco de dados PostgreSQL e cache Redis. Toda a infraestrutura roda em Docker.

---

## Estrutura de Pastas

```
meu-projeto/
├── backend/
│   ├── core/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── permissions.py
│   │   ├── usuarios/
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── throttles.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   └── empresas/
│   │       ├── admin.py
│   │       ├── apps.py
│   │       ├── models.py
│   │       ├── serializers.py
│   │       ├── views.py
│   │       └── urls.py
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   └── api/
│   │       └── client.js
│   ├── nginx.conf
│   ├── vite.config.js
│   └── Dockerfile
├── data/
│   ├── db/
│   ├── redis/
│   ├── staticfiles/
│   └── logs/
│       ├── backend/
│       └── nginx/
├── .env
├── .gitignore
└── docker-compose.yml
```

---

## Infraestrutura — Docker

### Containers

| Container | Imagem | Função |
|---|---|---|
| `db` | postgres:16-alpine | Banco de dados principal |
| `redis` | redis:7-alpine | Cache e blacklist de tokens JWT |
| `backend` | python:3.12-slim | API Django + Gunicorn |
| `frontend` | nginx:alpine | React + Vite buildado + proxy reverso |

### Fluxo

```
Usuário → Nginx (porta 80) → React (arquivos estáticos)
                           → /api/*   → Django (Gunicorn :8000) → PostgreSQL
                           → /admin/* → Django Admin
                           → /static/ → staticfiles (volume compartilhado)
```

### `docker-compose.yml`

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: always
    env_file: .env
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - ./data/db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - ./data/redis:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    restart: always
    env_file: .env
    volumes:
      - ./data/logs/backend:/app/logs
      - ./data/staticfiles:/app/staticfiles
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: >
      sh -c "python manage.py makemigrations &&
             python manage.py migrate &&
             python manage.py collectstatic --noinput &&
             gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3"

  frontend:
    build: ./frontend
    volumes:
      - ./data/logs/nginx:/var/log/nginx
      - ./data/staticfiles:/usr/share/nginx/staticfiles
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
```

### Volumes persistidos em `data/`

| Pasta | Conteúdo |
|---|---|
| `data/db/` | Arquivos do PostgreSQL |
| `data/redis/` | Dados do Redis |
| `data/staticfiles/` | Arquivos estáticos do Django (compartilhado com Nginx) |
| `data/logs/backend/` | Logs do Django |
| `data/logs/nginx/` | Logs do Nginx |

---

## Backend — Django

### Dependências (`requirements.txt`)

```
django
djangorestframework
django-cors-headers
python-decouple
djangorestframework-simplejwt[blacklist]
psycopg2-binary
gunicorn
drf-spectacular
django-redis
```

### Settings — pontos principais

- `SECRET_KEY` e credenciais lidas via `python-decouple` do `.env`
- `DEBUG=False` em produção
- `AUTH_USER_MODEL = 'usuarios.Usuario'` — autenticação por email
- `CorsMiddleware` como primeiro middleware
- Banco configurado via variáveis de ambiente
- Cache configurado com Redis via `django-redis`
- JWT com access token de 30 minutos e refresh de 7 dias com rotação e blacklist ativa
- Logs salvos em `/app/logs/django.log`
- `LANGUAGE_CODE = 'pt-BR'`
- `TIME_ZONE = 'America/Sao_Paulo'`

### Rate Limiting

| Escopo | Limite |
|---|---|
| Login (`/api/auth/login/`) | 5 tentativas por minuto por IP |
| Usuários anônimos | 20 requisições por hora |
| Usuários autenticados | 1000 requisições por hora |

---

## Models

### Usuario (`apps.usuarios`)

Autenticação via email. Estende `AbstractBaseUser` e `PermissionsMixin`.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | BigAutoField | PK interno (nunca exposto na API) |
| `public_id` | UUIDField | Identificador público |
| `email` | EmailField | Login — único |
| `nome` | CharField(255) | Nome completo |
| `telefone` | CharField(11) | Opcional |
| `is_active` | BooleanField | Conta ativa globalmente |
| `is_staff` | BooleanField | Acesso ao Django Admin |
| `date_joined` | DateTimeField | Auto |
| `data_atualizacao` | DateTimeField | Auto |

**Níveis de acesso:**

| Campo | Papel |
|---|---|
| `is_superuser = True` | Superadmin — dono do SaaS, acesso total |
| `is_staff = True` | Acesso ao Django Admin |
| role via `UsuarioEmpresa` | Admin ou Operador por empresa |

> O status do usuário é controlado por empresa via `UsuarioEmpresa.ativo`, não globalmente.

---

### Empresa (`apps.empresas`)

Representa o tenant do sistema.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | BigAutoField | PK interno |
| `public_id` | UUIDField | Identificador público |
| `cnpj` | CharField(14) | Único |
| `razao_social` | CharField(255) | Obrigatório |
| `nome_fantasia` | CharField(255) | Opcional |
| `status` | choices | Ver abaixo |
| `email` | EmailField | Opcional |
| `telefone` | CharField(11) | Opcional |
| `cota_mensal` | PositiveIntegerField | Créditos do plano mensal |
| `creditos_extras` | PositiveIntegerField | Créditos avulsos |
| `consumo_mes` | PositiveIntegerField | Consumo no mês atual |
| `mes_referencia` | DateField | Mês de referência do consumo |
| `data_cadastro` | DateTimeField | Auto |
| `data_atualizacao` | DateTimeField | Auto |

**Status disponíveis:**

| Valor | Descrição |
|---|---|
| `pendente` | Cadastro feito, aguardando ativação |
| `trial` | Período de teste |
| `ativo` | Conta ativa e pagante |
| `inativo` | Temporariamente inativo |
| `suspenso` | Suspenso por inadimplência |
| `desativado` | Desativado permanentemente |

**Lógica de cota:**
```
cota_disponivel = (cota_mensal - consumo_mes) + creditos_extras
```

---

### PersonalizacaoEmpresa

Criada automaticamente junto com a Empresa. Relação `OneToOne`.

| Campo | Tipo | Descrição |
|---|---|---|
| `cor_primaria` | CharField(7) | Hex, default `#000000` |
| `cor_secundaria` | CharField(7) | Hex, default `#ffffff` |
| `logo` | URLField | URL do logo (futuro: Cloudflare R2) |
| `data_atualizacao` | DateTimeField | Auto |

---

### CreditoExtra

Histórico de créditos avulsos adicionados por empresa.

| Campo | Tipo | Descrição |
|---|---|---|
| `empresa` | FK Empresa | |
| `quantidade` | PositiveIntegerField | Deve ser > 0 |
| `descricao` | CharField(255) | Opcional |
| `data_compra` | DateTimeField | Auto |

> Futuro: será integrado ao Stripe para liberação automática mediante pagamento.

---

### UsuarioEmpresa

Vínculo entre usuário e empresa. Um usuário pode pertencer a múltiplas empresas com roles diferentes.

| Campo | Tipo | Descrição |
|---|---|---|
| `usuario` | FK Usuario | |
| `empresa` | FK Empresa | |
| `role` | choices | `admin` ou `operador` |
| `ativo` | BooleanField | Status do usuário nesta empresa |
| `data_vinculo` | DateTimeField | Auto |

**Unique together:** `(usuario, empresa)`

---

## Permissions (`apps/core/permissions.py`)

| Classe | Descrição |
|---|---|
| `IsSuperAdmin` | Apenas `is_superuser = True` |
| `IsAdminEmpresa` | Usuário com role `admin` em empresa ativa |
| `IsMembroEmpresa` | Qualquer usuário ativo vinculado a qualquer empresa |

---

## APIs

### Resumo dos Endpoints

| Método | Endpoint | Permissão | Descrição |
|---|---|---|---|
| POST | `/api/auth/login/` | Público | Login — retorna JWT |
| POST | `/api/auth/refresh/` | Público | Renova access token |
| POST | `/api/auth/logout/` | Autenticado | Invalida o refresh token |
| POST | `/api/usuarios/criar/` | Admin Empresa | Cria operador e vincula à empresa |
| GET | `/api/usuarios/` | Admin Empresa | Lista usuários da própria empresa |
| GET/PUT | `/api/usuarios/me/` | Autenticado | Consulta/edita nome e telefone |
| POST | `/api/usuarios/me/senha/` | Autenticado | Altera própria senha |
| PATCH | `/api/usuarios/{public_id}/desativar/` | Admin Empresa | Ativa/desativa operador |
| GET | `/api/empresas/minha/` | Membro | Retorna razão social e CNPJ |
| PUT | `/api/empresas/minha/` | Admin Empresa | Edita nome fantasia e telefone |
| GET/PUT | `/api/empresas/minha/personalizacao/` | Admin Empresa | Consulta/edita cores e logo |
| POST | `/api/empresas/{public_id}/creditos/` | SuperAdmin | Adiciona créditos extras |

### Autenticação

Todas as rotas protegidas exigem o header:
```
Authorization: Bearer <access_token>
```

O access token expira em **30 minutos**. O refresh token expira em **7 dias** com rotação automática. Ao fazer logout, o refresh token é adicionado à blacklist e invalidado imediatamente.

---

## Django Admin

Acessível em `http://localhost/admin/` com superusuário.

### Empresas
- Criar, editar e visualizar empresas
- Gerenciar personalização (cores e logo) inline
- Gerenciar vínculos de usuários inline
- Histórico de créditos extras inline
- Cota disponível exibida em verde/vermelho

### Usuários
- Criar usuários com hash de senha correto
- Gerenciar permissões e status
- Campos: email, nome, telefone, is_active, is_staff, is_superuser

---

## Fluxo Operacional

### Onboarding de um novo cliente

1. Comercial fecha contrato com o cliente
2. SuperAdmin cria a empresa pelo Django Admin
3. SuperAdmin cria o usuário administrador do cliente pelo Django Admin
4. SuperAdmin vincula o usuário à empresa com role `admin` pelo Django Admin
5. Admin do cliente faz login e começa a operar

### Admin da empresa cria operadores

1. Admin faz login — obtém JWT
2. `POST /api/usuarios/criar/` com dados do operador
3. Operador é criado e vinculado automaticamente à empresa do admin (via JWT)

---

## Variáveis de Ambiente (`.env`)

```env
SECRET_KEY=chave-longa-e-aleatoria
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,seu-dominio.com

DB_NAME=nome_do_banco
DB_USER=usuario_do_banco
DB_PASSWORD=senha_forte
DB_HOST=db
DB_PORT=5432

REDIS_URL=redis://redis:6379/0

CORS_ALLOWED_ORIGINS=http://localhost,https://seu-dominio.com
```

---

## `.gitignore`

```
.env
venv/
__pycache__/
*.pyc
node_modules/
dist/
staticfiles/
data/
```

---

## Comandos Úteis

```bash
# Subir tudo
docker-compose up --build

# Subir em background
docker-compose up -d --build

# Criar superusuário
docker-compose exec backend python manage.py createsuperuser

# Ver logs em tempo real
docker-compose logs -f backend
docker-compose logs -f redis

# Acessar o banco
docker-compose exec db psql -U DB_USER -d DB_NAME

# Parar e remover volumes (cuidado: apaga tudo)
docker-compose down -v
```

---

## Próximos Passos (v2)

- HTTPS com certificado SSL
- Integração com Stripe para planos recorrentes e liberação automática de créditos
- Migração de arquivos estáticos/media para Cloudflare R2 via `django-storages`
