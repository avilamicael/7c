import os
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from apps.core.mixins import NormalizarTextoMixin
from .models import Usuario

AVATAR_MAX_MB = 2
AVATAR_FORMATOS = ["image/jpeg", "image/png"]


class UsuarioSerializer(NormalizarTextoMixin, serializers.ModelSerializer):
    _normalizar = ["nome", "sobrenome", "telefone", "endereco", "cidade", "uf"]
    role = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            "public_id", "email", "nome", "sobrenome",
            "telefone", "endereco", "cidade", "uf",
            "avatar_url", "role", "is_active", "date_joined",
        ]
        read_only_fields = ["public_id", "email", "is_active", "date_joined", "role", "avatar_url"]

    def get_role(self, obj):
        try:
            return obj.empresa_vinculo.role
        except Exception:
            return None

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.avatar.url)
        return obj.avatar.url


class AtualizarPerfilSerializer(NormalizarTextoMixin, serializers.ModelSerializer):
    _normalizar = ["nome", "sobrenome", "telefone", "endereco", "cidade", "uf"]

    class Meta:
        model = Usuario
        fields = ["nome", "sobrenome", "email", "telefone", "endereco", "cidade", "uf"]

    def validate_email(self, value):
        value = value.lower().strip()
        qs = Usuario.objects.filter(email=value).exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Este e-mail já está em uso.")
        return value


class AvatarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ["avatar"]

    def validate_avatar(self, value):
        if value.content_type not in AVATAR_FORMATOS:
            raise serializers.ValidationError("Formato inválido. Use PNG ou JPG.")
        if value.size > AVATAR_MAX_MB * 1024 * 1024:
            raise serializers.ValidationError(f"Tamanho máximo: {AVATAR_MAX_MB}MB.")
        return value


class AlterarSenhaSerializer(serializers.Serializer):
    senha_atual = serializers.CharField(write_only=True)
    nova_senha = serializers.CharField(write_only=True, min_length=8)
    confirmar_nova_senha = serializers.CharField(write_only=True)

    def validate_senha_atual(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Senha atual incorreta.")
        return value

    def validate(self, attrs):
        if attrs["nova_senha"] != attrs["confirmar_nova_senha"]:
            raise serializers.ValidationError(
                {"confirmar_nova_senha": "As senhas não coincidem."}
            )
        try:
            validate_password(attrs["nova_senha"], self.context["request"].user)
        except DjangoValidationError as e:
            raise serializers.ValidationError({"nova_senha": list(e.messages)})
        return attrs

    def save(self):
        user = self.context["request"].user
        user.set_password(self.validated_data["nova_senha"])
        user.save(update_fields=["password"])
        return user


class CriarUsuarioSerializer(NormalizarTextoMixin, serializers.ModelSerializer):
    _normalizar = ["email", "nome"]
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Usuario
        fields = ["email", "nome", "sobrenome", "telefone", "password"]

    def validate_email(self, value):
        value = value.lower().strip()
        if Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError("E-mail já cadastrado.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = Usuario(**validated_data)
        user.set_password(password)
        user.save()
        return user