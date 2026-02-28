from rest_framework import serializers
from .models import Empresa, UsuarioEmpresa, CreditoExtra, PersonalizacaoEmpresa
from apps.core.mixins  import NormalizarTextoMixin


class MinhaEmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = ['razao_social', 'cnpj']


class PersonalizacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalizacaoEmpresa
        fields = ['cor_primaria', 'cor_secundaria', 'logo', 'data_atualizacao']
        read_only_fields = ['data_atualizacao']


class EmpresaEditarSerializer(NormalizarTextoMixin, serializers.ModelSerializer):
    campos_lower = ['nome_fantasia']

    class Meta:
        model = Empresa
        fields = ['nome_fantasia', 'telefone']


class CreditoExtraSerializer(NormalizarTextoMixin, serializers.ModelSerializer):
    campos_lower = ['descricao']

    class Meta:
        model = CreditoExtra
        fields = ['id', 'quantidade', 'descricao', 'data_compra']
        read_only_fields = ['data_compra']

    def validate_quantidade(self, value):
        if value <= 0:
            raise serializers.ValidationError('Quantidade deve ser maior que zero.')
        return value


class UsuarioEmpresaSerializer(serializers.ModelSerializer):
    public_id = serializers.UUIDField(source='usuario.public_id', read_only=True)
    email     = serializers.EmailField(source='usuario.email', read_only=True)
    nome      = serializers.CharField(source='usuario.nome', read_only=True)
    telefone  = serializers.CharField(source='usuario.telefone', read_only=True)

    class Meta:
        model = UsuarioEmpresa
        fields = ['public_id', 'email', 'nome', 'telefone', 'role', 'ativo', 'data_vinculo']
        read_only_fields = ['data_vinculo']