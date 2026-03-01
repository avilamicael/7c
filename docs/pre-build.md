## Primeiro acesso:

no primeiro acesso vai dar erro pq o usuario nao existe.
Deixe o sistema rodando, abre outro shell e rode:

docker-compose exec backend python manage.py makemigrations usuarios

docker-compose exec backend python manage.py makemigrations empresas

docker-compose exec backend python manage.py migrate


Diagrama em formato Mermaid (Usar para gerar arquitetura)

01/03:

Confirmado. O backend não tem volume mapeando o código — o build: ./backend copia o código para dentro da imagem via Dockerfile, mas as migrations geradas ficam dentro do container e somem quando ele morre.
Você tem duas opções:
Opção 1 — gerar as migrations localmente (mais simples, recomendada):
Você precisa ter Python e Django instalados localmente, ou usar o container com volume temporário:
bashdocker-compose run --rm -v ${PWD}/backend:/app backend python manage.py makemigrations
Isso monta seu código local dentro do container, então os arquivos gerados aparecem na sua máquina em D:\7c\backend\apps\.
Depois:
bashdocker-compose run --rm backend python manage.py migrate
Opção 2 — adicionar volume do código no docker-compose (melhor para desenvolvimento):
yamlbackend:
  build: ./backend
  volumes:
    - ./backend:/app          # ← adiciona isso
    - ./data/logs/backend:/app/logs
    - ./data/staticfiles:/app/staticfiles
Com isso o código local fica sincronizado com o container. Rode makemigrations normalmente e os arquivos aparecem na sua máquina.
Para desenvolvimento a opção 2 é melhor — qualquer alteração no código reflete no container sem precisar rebuildar. Qual prefere?