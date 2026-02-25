# Documentação do Projeto — Django + React + Vite + Docker

## Visão Geral

Projeto fullstack com backend em Django (API REST) e frontend em React + Vite, servido por Nginx, com banco de dados PostgreSQL. Toda a infraestrutura roda em Docker.

---

## Estrutura de Pastas

```
meu-projeto/
├── backend/              # Django
│   ├── core/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── apps/
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/             # React + Vite
│   ├── src/
│   │   └── api/
│   │       └── client.js
│   ├── nginx.conf
│   ├── vite.config.js
│   └── Dockerfile
├── data/                 # Dados persistidos fora dos containers
│   ├── db/               # Arquivos do PostgreSQL
│   └── logs/
│       ├── backend/      # Logs do Django
│       └── nginx/        # Logs do Nginx
├── .env                  # Variáveis de ambiente (nunca commitar)
├── .gitignore
└── docker-compose.yml
```

---

## Backend — Django

### Dependências (`requirements.txt`)

```
django
djangorestframework
django-cors-headers
python-decouple
djangorestframework-simplejwt
psycopg2-binary
gunicorn
```

### `settings.py` (pontos principais)

- `SECRET_KEY` e demais credenciais lidas via `python-decouple` do `.env`
- `DEBUG=False` em produção
- `CorsMiddleware` como primeiro middleware
- Banco configurado via variáveis de ambiente
- JWT com access token de 30 minutos e refresh de 7 dias com rotação
- Logs salvos em `/app/logs/django.log` (mapeado para `data/logs/backend/`)
- `LANGUAGE_CODE = 'pt-BR'`
- `TIME_ZONE = 'America/Sao_Paulo'`

### `Dockerfile` (backend)

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
```

> O `collectstatic` e o `migrate` rodam via `command` no `docker-compose.yml`, não no build, pois precisam das variáveis de ambiente do `.env`.

---

## Frontend — React + Vite

### `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
```

O proxy redireciona chamadas `/api/*` para o Django em desenvolvimento, evitando problemas de CORS.

### `src/api/client.js`

Instância do Axios configurada com interceptors para renovação automática de JWT.

### `nginx.conf`

```nginx
server {
    listen 80;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /static/ {
        proxy_pass http://backend:8000;
    }
}
```

### `Dockerfile` (frontend)

```dockerfile
# Estágio 1 — build
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

# Estágio 2 — servir com Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

---

## Docker Compose

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

  backend:
    build: ./backend
    restart: always
    env_file: .env
    volumes:
      - ./data/logs/backend:/app/logs
    depends_on:
      db:
        condition: service_healthy
    command: >
      sh -c "python manage.py collectstatic --noinput &&
             python manage.py migrate &&
             gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3"

  frontend:
    build: ./frontend
    restart: always
    volumes:
      - ./data/logs/nginx:/var/log/nginx
    ports:
      - "80:80"
    depends_on:
      - backend
```

### Fluxo dos containers

```
Usuário → Nginx (porta 80) → React (arquivos estáticos)
                           → /api/* → Django (Gunicorn :8000) → PostgreSQL
```

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

# Parar e remover volumes (cuidado: apaga o banco)
docker-compose down -v

# Acessar o banco via terminal
docker-compose exec db psql -U DB_USER -d DB_NAME

# Criar superusuário Django
docker-compose exec backend python manage.py createsuperuser

# Ver logs em tempo real
docker-compose logs -f backend
docker-compose logs -f db
```

---

## Observações e Decisões de Arquitetura

- **Um único `settings.py`** — o projeto roda diretamente em produção com usuários de teste, sem necessidade de múltiplos ambientes.
- **Dados persistidos em `data/`** — o volume do PostgreSQL é mapeado para `./data/db`, garantindo que os dados sobrevivem à recriação dos containers.
- **`collectstatic` no runtime** — roda junto com o `migrate` ao subir o container, pois precisa das variáveis do `.env` que não estão disponíveis no build.
- **Arquivos estáticos e media** — não foram mapeados para `data/` pois o projeto não utiliza o admin do Django ativamente. No futuro, a intenção é migrar para **Cloudflare R2** via `django-storages`.
- **Logs** — Django e Nginx salvam logs em `data/logs/`, fora dos containers, facilitando monitoramento e debug.
