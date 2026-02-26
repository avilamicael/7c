import uuid
from django.db import models


class Empresa(models.Model):
    class Status(models.TextChoices):
        PENDENTE   = 'pendente',   'Pendente'
        TRIAL      = 'trial',      'Trial'
        ATIVO      = 'ativo',      'Ativo'
        INATIVO    = 'inativo',    'Inativo'
        SUSPENSO   = 'suspenso',   'Suspenso'
        DESATIVADO = 'desativado', 'Desativado'

    id               = models.BigAutoField(primary_key=True)
    public_id        = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    cnpj             = models.CharField(max_length=14, unique=True)
    razao_social     = models.CharField(max_length=255)
    nome_fantasia    = models.CharField(max_length=255, blank=True)
    status           = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDENTE)
    email            = models.EmailField(blank=True)
    telefone         = models.CharField(max_length=11, blank=True)
    cota_mensal      = models.PositiveIntegerField(default=0)
    creditos_extras  = models.PositiveIntegerField(default=0)
    consumo_mes      = models.PositiveIntegerField(default=0)
    mes_referencia   = models.DateField(null=True, blank=True)
    data_cadastro    = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Empresa'
        verbose_name_plural = 'Empresas'

    def __str__(self):
        return self.razao_social

    @property
    def cota_disponivel(self):
        return max(0, (self.cota_mensal - self.consumo_mes) + self.creditos_extras)

    @property
    def tem_cota(self):
        return self.cota_disponivel > 0

class PersonalizacaoEmpresa(models.Model):
    empresa        = models.OneToOneField(Empresa, on_delete=models.CASCADE, related_name='personalizacao')
    cor_primaria   = models.CharField(max_length=7, default='#000000')   # hex
    cor_secundaria = models.CharField(max_length=7, default='#ffffff')   # hex
    logo           = models.URLField(blank=True)   # URL do arquivo (futuro: Cloudflare R2)
    data_atualizacao = models.DateTimeField(auto_now=True)

class CreditoExtra(models.Model):
    empresa     = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name='historico_creditos')
    quantidade  = models.PositiveIntegerField()
    descricao   = models.CharField(max_length=255, blank=True)
    data_compra = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Crédito Extra'
        verbose_name_plural = 'Créditos Extras'


class UsuarioEmpresa(models.Model):
    class Role(models.TextChoices):
        ADMIN    = 'admin',    'Administrador'
        OPERADOR = 'operador', 'Operador'

    usuario      = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, related_name='empresas')
    empresa      = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name='usuarios')
    role         = models.CharField(max_length=20, choices=Role.choices, default=Role.OPERADOR)
    ativo        = models.BooleanField(default=True)
    data_vinculo = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('usuario', 'empresa')
        verbose_name = 'Usuário da Empresa'
        verbose_name_plural = 'Usuários da Empresa'