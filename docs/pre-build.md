## Primeiro acesso:

no primeiro acesso vai dar erro pq o usuario nao existe.
Deixe o sistema rodando, abre outro shell e rode:

docker-compose exec backend python manage.py makemigrations usuarios

docker-compose exec backend python manage.py makemigrations empresas

docker-compose exec backend python manage.py migrate


Diagrama em formato Mermaid (Usar para gerar arquitetura)