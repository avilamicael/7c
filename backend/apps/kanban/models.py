import uuid
from django.db import models
from apps.empresas.models import Empresa
from apps.usuarios.models import Usuario


class KanbanBoard(models.Model):
    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name="boards")
    nome = models.CharField(max_length=150)
    descricao = models.TextField(blank=True, default="")
    ativo = models.BooleanField(default=True)
    criado_por = models.ForeignKey(
        Usuario, on_delete=models.SET_NULL, null=True, related_name="boards_criados"
    )
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-data_criacao"]

    def __str__(self):
        return f"{self.empresa.nome_fantasia} — {self.nome}"


class KanbanColuna(models.Model):
    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    board = models.ForeignKey(KanbanBoard, on_delete=models.CASCADE, related_name="colunas")
    nome = models.CharField(max_length=100)
    posicao = models.PositiveIntegerField()
    cor = models.CharField(max_length=7, default="#5dca6c")
    limite_wip = models.PositiveIntegerField(null=True, blank=True)
    data_criacao = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["posicao"]

    def __str__(self):
        return f"{self.board.nome} › {self.nome}"


class KanbanCard(models.Model):
    class Prioridade(models.TextChoices):
        BAIXA = "BAIXA", "Baixa"
        MEDIA = "MEDIA", "Média"
        ALTA = "ALTA", "Alta"
        URGENTE = "URGENTE", "Urgente"

    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    coluna = models.ForeignKey(KanbanColuna, on_delete=models.CASCADE, related_name="cards")
    titulo = models.CharField(max_length=255)
    descricao = models.TextField(blank=True, default="")
    posicao = models.PositiveIntegerField()
    prioridade = models.CharField(max_length=10, choices=Prioridade.choices, default=Prioridade.MEDIA)
    data_vencimento = models.DateField(null=True, blank=True)
    responsavel = models.ForeignKey(
        Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name="cards_responsavel"
    )
    criado_por = models.ForeignKey(
        Usuario, on_delete=models.SET_NULL, null=True, related_name="cards_criados"
    )
    ativo = models.BooleanField(default=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["posicao"]

    def __str__(self):
        return self.titulo