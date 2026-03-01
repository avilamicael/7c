import uuid
from django.db import models
from django.core.validators import RegexValidator
from apps.empresas.models import Empresa


class Fornecedor(models.Model):
    class TipoPessoa(models.TextChoices):
        FISICA = "PF", "Pessoa Física"
        JURIDICA = "PJ", "Pessoa Jurídica"

    class Estado(models.TextChoices):
        AC = "AC", "Acre"
        AL = "AL", "Alagoas"
        AP = "AP", "Amapá"
        AM = "AM", "Amazonas"
        BA = "BA", "Bahia"
        CE = "CE", "Ceará"
        DF = "DF", "Distrito Federal"
        ES = "ES", "Espírito Santo"
        GO = "GO", "Goiás"
        MA = "MA", "Maranhão"
        MT = "MT", "Mato Grosso"
        MS = "MS", "Mato Grosso do Sul"
        MG = "MG", "Minas Gerais"
        PA = "PA", "Pará"
        PB = "PB", "Paraíba"
        PR = "PR", "Paraná"
        PE = "PE", "Pernambuco"
        PI = "PI", "Piauí"
        RJ = "RJ", "Rio de Janeiro"
        RN = "RN", "Rio Grande do Norte"
        RS = "RS", "Rio Grande do Sul"
        RO = "RO", "Rondônia"
        RR = "RR", "Roraima"
        SC = "SC", "Santa Catarina"
        SP = "SP", "São Paulo"
        SE = "SE", "Sergipe"
        TO = "TO", "Tocantins"

    # Identificação
    public_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    empresa = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name="fornecedores")
    tipo_pessoa = models.CharField(max_length=2, choices=TipoPessoa.choices, default=TipoPessoa.JURIDICA)

    # Dados cadastrais
    razao_social = models.CharField(max_length=255)
    nome_fantasia = models.CharField(max_length=255, blank=True)

    # Documentos — validados na camada de serializer
    cnpj = models.CharField(max_length=14, blank=True, db_index=True)
    ie = models.CharField("Inscrição Estadual", max_length=20, blank=True)
    cpf = models.CharField(max_length=11, blank=True, db_index=True)
    rg = models.CharField(max_length=20, blank=True)

    # Contato
    email = models.EmailField(blank=True)
    telefone = models.CharField(
        max_length=11,
        blank=True,
        validators=[RegexValidator(r"^\d{10,11}$", "Informe DDD + número sem formatação.")],
    )
    telefone_secundario = models.CharField(
        max_length=11,
        blank=True,
        validators=[RegexValidator(r"^\d{10,11}$", "Informe DDD + número sem formatação.")],
    )
    site = models.URLField(blank=True)

    # Endereço
    cep = models.CharField(
        max_length=8,
        blank=True,
        validators=[RegexValidator(r"^\d{8}$", "CEP deve conter 8 dígitos.")],
    )
    logradouro = models.CharField(max_length=255, blank=True)
    numero = models.CharField(max_length=20, blank=True)
    complemento = models.CharField(max_length=100, blank=True)
    bairro = models.CharField(max_length=100, blank=True)
    cidade = models.CharField(max_length=100, blank=True)
    estado = models.CharField(max_length=2, choices=Estado.choices, blank=True)
    pais = models.CharField(max_length=2, default="BR")

    # Dados bancários do fornecedor (para TED/PIX)
    banco_nome = models.CharField(max_length=100, blank=True)
    banco_agencia = models.CharField(max_length=10, blank=True)
    banco_conta = models.CharField(max_length=20, blank=True)
    banco_pix = models.CharField(max_length=150, blank=True)

    # Controle
    observacoes = models.TextField(blank=True)
    ativo = models.BooleanField(default=True, db_index=True)
    data_cadastro = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Fornecedor"
        verbose_name_plural = "Fornecedores"
        ordering = ["razao_social"]
        constraints = [
            models.UniqueConstraint(
                fields=["empresa", "cnpj"],
                condition=models.Q(cnpj__gt=""),
                name="unique_fornecedor_cnpj_por_empresa",
            ),
            models.UniqueConstraint(
                fields=["empresa", "cpf"],
                condition=models.Q(cpf__gt=""),
                name="unique_fornecedor_cpf_por_empresa",
            ),
        ]

    def __str__(self) -> str:
        return self.razao_social

    @property
    def documento(self) -> str:
        return self.cnpj if self.tipo_pessoa == self.TipoPessoa.JURIDICA else self.cpf