from rest_framework import serializers
from .models import Fornecedor
from core.validators import validar_cnpj, validar_cpf
from django.core.exceptions import ValidationError as DjangoValidationError

class FornecedorSerializer(serializers.ModelSerializer):
    tipo_pessoa_display = serializers.CharField(source="get_tipo_pessoa_display", read_only=True)
    documento = serializers.CharField(read_only=True)

    class Meta:
        model = Fornecedor
        fields = [
            "public_id",
            "tipo_pessoa", "tipo_pessoa_display",
            "razao_social", "nome_fantasia",
            "cnpj", "ie", "cpf", "rg",
            "email", "telefone", "telefone_secundario", "site",
            "cep", "logradouro", "numero", "complemento",
            "bairro", "cidade", "estado", "pais",
            "banco_nome", "banco_agencia", "banco_conta", "banco_pix",
            "observacoes", "ativo", "documento",
            "data_cadastro", "data_atualizacao",
        ]
        read_only_fields = ["public_id", "data_cadastro", "data_atualizacao", "documento"]

    def validate(self, attrs):
        tipo = attrs.get("tipo_pessoa", Fornecedor.TipoPessoa.JURIDICA)

        if tipo == Fornecedor.TipoPessoa.JURIDICA:
            cnpj = attrs.get("cnpj")

            if not cnpj:
                raise serializers.ValidationError({"cnpj": "CNPJ obrigatório para Pessoa Jurídica."})

            try:
                validar_cnpj(cnpj)
            except DjangoValidationError as e:
                raise serializers.ValidationError({"cnpj": e.message})

        else:
            cpf = attrs.get("cpf")

            if not cpf:
                raise serializers.ValidationError({"cpf": "CPF obrigatório para Pessoa Física."})

            if not validar_cpf(cpf):
                raise serializers.ValidationError({"cpf": "CPF inválido."})

        return attrs