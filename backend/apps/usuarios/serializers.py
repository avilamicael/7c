from rest_framework import serializers
from .models import Usuario
from apps.empresas.models import UsuarioEmpresa
from apps.core.mixins import NormalizarTextoMixin


class UsuarioSerializer(NormalizarTextoMixin, serializers.ModelSerializer):
    campos_lower = ['nome', 'telefone']

    class Meta:
        model = Usuario
        fields = ['public_id', 'email', 'nome', 'telefone']
        read_only_fields = ['public_id', 'email']


class CriarUsuarioSerializer(NormalizarTextoMixin, serializers.ModelSerializer):
    campos_lower = ['email', 'nome']
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Usuario
        fields = ['email', 'nome', 'telefone', 'password']

    def create(self, validated_data):
        return Usuario.objects.create_user(**validated_data)


class AlterarSenhaSerializer(serializers.Serializer):
    senha_atual = serializers.CharField(write_only=True)
    nova_senha  = serializers.CharField(write_only=True, min_length=8)

    def validate_senha_atual(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Senha atual incorreta.')
        return value

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['nova_senha'])
        user.save(update_fields=['password'])


class UsuarioEmpresaListSerializer(serializers.ModelSerializer):
    public_id = serializers.UUIDField(source='usuario.public_id', read_only=True)
    nome      = serializers.CharField(source='usuario.nome', read_only=True)
    email     = serializers.EmailField(source='usuario.email', read_only=True)
    telefone  = serializers.CharField(source='usuario.telefone', read_only=True)

    class Meta:
        model = UsuarioEmpresa
        fields = ['public_id', 'nome', 'email', 'telefone', 'role', 'ativo', 'data_vinculo']