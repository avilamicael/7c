from rest_framework import serializers
from .models import Cliente, ClienteDocumento, ClienteTelefone


class ClienteDocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ClienteDocumento
        fields = ['id', 'tipo', 'tipo_outro', 'numero']

    def validate(self, attrs):
        if attrs.get('tipo') == ClienteDocumento.Tipo.OUTRO and not attrs.get('tipo_outro', '').strip():
            raise serializers.ValidationError({'tipo_outro': 'Informe o tipo do documento.'})
        if attrs.get('tipo') != ClienteDocumento.Tipo.OUTRO:
            attrs['tipo_outro'] = ''
        return attrs


class ClienteTelefoneSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ClienteTelefone
        fields = ['id', 'tipo', 'nome', 'numero']

    def validate(self, attrs):
        if attrs.get('tipo') == ClienteTelefone.Tipo.OUTRO and not attrs.get('nome', '').strip():
            raise serializers.ValidationError({'nome': 'Informe o nome do contato.'})
        return attrs


class ClienteSerializer(serializers.ModelSerializer):
    documentos = ClienteDocumentoSerializer(many=True, read_only=True)
    telefones  = ClienteTelefoneSerializer(many=True, read_only=True)

    class Meta:
        model  = Cliente
        fields = [
            'public_id',
            'nome', 'sobrenome', 'data_nascimento', 'nacionalidade',
            'passaporte', 'passaporte_emissao', 'passaporte_expiracao', 'passaporte_pais',
            'email', 'rede_social',
            'observacoes', 'ativo',
            'documentos', 'telefones',
            'criado_por', 'atualizado_por',
            'data_cadastro', 'data_atualizacao',
        ]
        read_only_fields = ['public_id', 'criado_por', 'atualizado_por', 'data_cadastro', 'data_atualizacao']


class ClienteListSerializer(serializers.ModelSerializer):
    """Serializer enxuto para listagem."""
    class Meta:
        model  = Cliente
        fields = ['public_id', 'nome', 'sobrenome', 'nacionalidade', 'email', 'ativo', 'data_cadastro']