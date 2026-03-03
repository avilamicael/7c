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
    documentos = ClienteDocumentoSerializer(many=True, required=False)
    telefones  = ClienteTelefoneSerializer(many=True, required=False)

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

    def _sync_documentos(self, cliente, documentos_data):
        ids_recebidos = [d['id'] for d in documentos_data if 'id' in d]
        cliente.documentos.exclude(id__in=ids_recebidos).delete()

        for doc in documentos_data:
            doc_id = doc.pop('id', None)
            if doc_id:
                ClienteDocumento.objects.filter(id=doc_id, cliente=cliente).update(**doc)
            else:
                ClienteDocumento.objects.create(cliente=cliente, **doc)

    def _sync_telefones(self, cliente, telefones_data):
        ids_recebidos = [t['id'] for t in telefones_data if 'id' in t]
        cliente.telefones.exclude(id__in=ids_recebidos).delete()

        for tel in telefones_data:
            tel_id = tel.pop('id', None)
            if tel_id:
                ClienteTelefone.objects.filter(id=tel_id, cliente=cliente).update(**tel)
            else:
                ClienteTelefone.objects.create(cliente=cliente, **tel)

    def create(self, validated_data):
        documentos_data = validated_data.pop('documentos', [])
        telefones_data  = validated_data.pop('telefones', [])
        cliente = Cliente.objects.create(**validated_data)
        self._sync_documentos(cliente, documentos_data)
        self._sync_telefones(cliente, telefones_data)
        return cliente

    def update(self, instance, validated_data):
        documentos_data = validated_data.pop('documentos', None)
        telefones_data  = validated_data.pop('telefones', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if documentos_data is not None:
            self._sync_documentos(instance, documentos_data)
        if telefones_data is not None:
            self._sync_telefones(instance, telefones_data)

        return instance


class ClienteListSerializer(serializers.ModelSerializer):
    cpf               = serializers.SerializerMethodField()
    telefone_principal = serializers.SerializerMethodField()

    class Meta:
        model  = Cliente
        fields = [
            'public_id', 'nome', 'sobrenome', 'nacionalidade',
            'email', 'ativo', 'data_cadastro', 'data_nascimento',
            'passaporte', 'cpf', 'telefone_principal',
        ]

    def get_cpf(self, obj):
        doc = obj.documentos.filter(tipo=ClienteDocumento.Tipo.CPF).first()
        return doc.numero if doc else None

    def get_telefone_principal(self, obj):
        tel = obj.telefones.filter(tipo=ClienteTelefone.Tipo.PROPRIO).first()
        return tel.numero if tel else None