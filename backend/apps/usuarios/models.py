import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from apps.core.validators import validar_cep, validar_telefone


class UsuarioManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('O email é obrigatório')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    id               = models.BigAutoField(primary_key=True)
    public_id        = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    email            = models.EmailField(unique=True)
    nome             = models.CharField(max_length=255)
    sobrenome        = models.CharField(max_length=255, blank=True, default="")
    endereco         = models.CharField(max_length=500, blank=True, default="")
    cidade           = models.CharField(max_length=100, blank=True, default="")
    uf               = models.CharField(max_length=2, blank=True, default="")
    cep              = models.CharField(max_length=8, blank=True, default="", validators=[validar_cep])
    avatar           = models.ImageField(upload_to="avatars/%Y/%m/", null=True, blank=True,) 
    telefone         = models.CharField(max_length=11, blank=True, null=True, validators=[validar_telefone])
    is_active        = models.BooleanField(default=True)
    is_staff         = models.BooleanField(default=False)
    date_joined      = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    objects = UsuarioManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'

    def __str__(self):
        return self.email