# apps/clientes/models.py
import uuid
from django.db import models
from apps.empresas.models import Empresa
from apps.usuarios.models import Usuario


class Cliente(models.Model):
    id               = models.BigAutoField(primary_key=True)
    public_id        = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    empresa          = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name='clientes')

    # Dados pessoais
    nome             = models.CharField(max_length=150)
    sobrenome        = models.CharField(max_length=150)
    data_nascimento  = models.DateField(null=True, blank=True)
    nacionalidade    = models.CharField(max_length=2, blank=True)  # ISO alpha-2

    # Passaporte
    passaporte           = models.CharField(max_length=20, blank=True)
    passaporte_emissao   = models.DateField(null=True, blank=True)
    passaporte_expiracao = models.DateField(null=True, blank=True)
    passaporte_pais      = models.CharField(max_length=2, blank=True)  # ISO alpha-2

    # Contato
    email       = models.EmailField(blank=True)
    rede_social = models.CharField(max_length=255, blank=True)

    # Extras
    observacoes = models.TextField(blank=True)
    ativo       = models.BooleanField(default=True)

    # Auditoria
    criado_por       = models.ForeignKey(Usuario, null=True, on_delete=models.SET_NULL, related_name='clientes_criados')
    atualizado_por   = models.ForeignKey(Usuario, null=True, on_delete=models.SET_NULL, related_name='clientes_atualizados')
    data_cadastro    = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        unique_together = [
            ('empresa', 'passaporte'),
        ]

    def __str__(self):
        return f'{self.nome} {self.sobrenome}'


class ClienteDocumento(models.Model):
    class Tipo(models.TextChoices):
        CPF   = 'cpf',   'CPF'
        RG    = 'rg',    'RG'
        CNH   = 'cnh',   'CNH'
        OUTRO = 'outro', 'Outro'

    cliente    = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='documentos')
    tipo       = models.CharField(max_length=20, choices=Tipo.choices)
    tipo_outro = models.CharField(max_length=50, blank=True)
    numero     = models.CharField(max_length=50)

    class Meta:
        verbose_name = 'Documento'
        verbose_name_plural = 'Documentos'
        unique_together = [('cliente', 'tipo', 'numero')]

    def __str__(self):
        tipo_display = self.tipo_outro if self.tipo == self.Tipo.OUTRO else self.get_tipo_display()
        return f'{tipo_display} — {self.numero}'


class ClienteTelefone(models.Model):
    class Tipo(models.TextChoices):
        PROPRIO = 'proprio', 'Próprio'
        OUTRO   = 'outro',   'Outro'

    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='telefones')
    tipo    = models.CharField(max_length=20, choices=Tipo.choices, default=Tipo.PROPRIO)
    nome    = models.CharField(max_length=150, blank=True)
    numero  = models.CharField(max_length=20)

    class Meta:
        verbose_name = 'Telefone'
        verbose_name_plural = 'Telefones'

    def __str__(self):
        return f'{self.get_tipo_display()} — {self.numero}'
