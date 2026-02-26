# Documentação Técnica — Models, Serializers e Views

## Sumário

- [Estrutura de Apps](#estrutura-de-apps)
- [Models](#models)
  - [Usuario](#usuario)
  - [Empresa](#empresa)
  - [PersonalizacaoEmpresa](#personalizacaoempresa)
  - [CreditoExtra](#creditoextra)
  - [UsuarioEmpresa](#usuarioempresa)
- [Permissions](#permissions)
- [Serializers](#serializers)
  - [Usuários](#serializers-usuários)
  - [Empresas](#serializers-empresas)
- [Views](#views)
  - [Usuários](#views-usuários)
  - [Empresas](#views-empresas)
- [URLs](#urls)
- [Settings](#settings)

---

## Estrutura de Apps

```
backend/
└── apps/
    ├── core/
    │   ├── __init__.py
    │   └── permissions.py
    ├── usuarios/
    │   ├── apps.py
    │   ├── models.py
    │   ├── serializers.py
    │   ├── views.py
    │   └── urls.py
    └── empresas/
        ├── apps.py
        ├── models.py
        ├── serializers.py
        ├── views.py
        └── urls.py
```

---

## Models

### Usuario

**App:** `apps.usuarios`  
**Autenticação via email** (não username).  
Estende `AbstractBaseUser` e `PermissionsMixin`.

```python
# apps/usuarios/models.py
import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


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
    telefone         = models.CharField(max_length=20, blank=True)
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
```

**Campos obrigatórios:** `email`, `nome`  
**Campos opcionais:** `telefone`

**Níveis de acesso:**
| Campo | Papel |
|---|---|
| `is_superuser = True` | Superadmin — dono do SaaS, acesso total |
| `is_staff = True` | Acesso ao Django Admin |
| role via `UsuarioEmpresa` | Admin ou Operador por empresa |

---

### Empresa

**App:** `apps.empresas`  
Representa o tenant do sistema multitenant (separação por ID).

```python
# apps/empresas/models.py
import uuid
from django.db import models


class Empresa(models.Model):
    class Status(models.TextChoices):
        PENDENTE = 'pendente', 'Pendente'
        ATIVO    = 'ativo',    'Ativo'
        INATIVO  = 'inativo',  'Inativo'
        SUSPENSO = 'suspenso', 'Suspenso'

    id               = models.BigAutoField(primary_key=True)
    public_id        = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    cnpj             = models.CharField(max_length=14, unique=True)
    razao_social     = models.CharField(max_length=255)
    nome_fantasia    = models.CharField(max_length=255, blank=True)
    status           = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDENTE)
    email            = models.EmailField(blank=True)
    telefone         = models.CharField(max_length=20, blank=True)
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
```

**Campos obrigatórios:** `cnpj`, `razao_social`  
**Campos opcionais:** `nome_fantasia`, `email`, `telefone`, `mes_referencia`

**Lógica de cota de API:**
```
cota_disponivel = (cota_mensal - consumo_mes) + creditos_extras
```
- `cota_mensal` → créditos do plano mensal (renova todo mês via job)
- `creditos_extras` → créditos avulsos comprados
- `consumo_mes` → consumo no mês atual
- Quando `cota_disponivel <= 0` → acesso bloqueado

---

### PersonalizacaoEmpresa

**App:** `apps.empresas`  
Criada automaticamente junto com a `Empresa`. Relação `OneToOne`.

```python
class PersonalizacaoEmpresa(models.Model):
    empresa          = models.OneToOneField(Empresa, on_delete=models.CASCADE, related_name='personalizacao')
    cor_primaria     = models.CharField(max_length=7, default='#000000')
    cor_secundaria   = models.CharField(max_length=7, default='#ffffff')
    logo             = models.URLField(blank=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Personalização da Empresa'
```

**Campos obrigatórios:** `cor_primaria`, `cor_secundaria`  
**Campos opcionais:** `logo`

> `logo` armazena URL. Futuramente será integrado ao Cloudflare R2 via `django-storages`.

---

### CreditoExtra

**App:** `apps.empresas`  
Histórico de compras de créditos avulsos por empresa.

```python
class CreditoExtra(models.Model):
    empresa     = models.ForeignKey(Empresa, on_delete=models.PROTECT, related_name='historico_creditos')
    quantidade  = models.PositiveIntegerField()
    descricao   = models.CharField(max_length=255, blank=True)
    data_compra = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Crédito Extra'
        verbose_name_plural = 'Créditos Extras'
```

**Campos obrigatórios:** `empresa`, `quantidade`  
**Campos opcionais:** `descricao`

---

### UsuarioEmpresa

**App:** `apps.empresas`  
Tabela de vínculo entre `Usuario` e `Empresa`. Um usuário pode pertencer a mais de uma empresa com roles diferentes.

```python
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
```

**Todos os campos são obrigatórios.**

**Roles disponíveis:**
| Role | Descrição |
|---|---|
| `admin` | Administrador da empresa — futura página de gestão |
| `operador` | Usuário comum — acesso total ao sistema por ora |

---

## Permissions

**Arquivo:** `apps/core/permissions.py`

```python
from rest_framework.permissions import BasePermission
from apps.empresas.models import UsuarioEmpresa


class IsSuperAdmin(BasePermission):
    """Apenas superusuários do Django (donos do SaaS)."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_superuser


class IsEmpresaAdmin(BasePermission):
    """Usuário com role admin na empresa da requisição."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        empresa_public_id = view.kwargs.get('empresa_public_id')
        return UsuarioEmpresa.objects.filter(
            usuario=request.user,
            empresa__public_id=empresa_public_id,
            role=UsuarioEmpresa.Role.ADMIN,
            ativo=True
        ).exists()


class IsMembroEmpresa(BasePermission):
    """Qualquer usuário ativo vinculado à empresa."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        empresa_public_id = view.kwargs.get('empresa_public_id')
        return UsuarioEmpresa.objects.filter(
            usuario=request.user,
            empresa__public_id=empresa_public_id,
            ativo=True
        ).exists()
```

---

## Serializers

### Serializers — Usuários

**Arquivo:** `apps/usuarios/serializers.py`

```python
from rest_framework import serializers
from .models import Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['public_id', 'email', 'nome', 'telefone', 'is_active', 'date_joined']
        read_only_fields = ['public_id', 'date_joined']


class CriarUsuarioSerializer(serializers.ModelSerializer):
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
```

**Observações:**
- `id` interno **nunca** é exposto na API — apenas `public_id`
- `password` é `write_only` — nunca retorna na resposta
- Mínimo de 8 caracteres na senha

---

### Serializers — Empresas

**Arquivo:** `apps/empresas/serializers.py`

```python
from rest_framework import serializers
from .models import Empresa, UsuarioEmpresa, CreditoExtra, PersonalizacaoEmpresa


class PersonalizacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalizacaoEmpresa
        fields = ['cor_primaria', 'cor_secundaria', 'logo', 'data_atualizacao']
        read_only_fields = ['data_atualizacao']


class EmpresaSerializer(serializers.ModelSerializer):
    personalizacao = PersonalizacaoSerializer(read_only=True)

    class Meta:
        model = Empresa
        fields = [
            'public_id', 'cnpj', 'razao_social', 'nome_fantasia',
            'status', 'email', 'telefone', 'cota_mensal',
            'creditos_extras', 'consumo_mes', 'cota_disponivel',
            'personalizacao', 'data_cadastro', 'data_atualizacao'
        ]
        read_only_fields = [
            'public_id', 'consumo_mes', 'cota_disponivel',
            'data_cadastro', 'data_atualizacao'
        ]

    def validate_cnpj(self, value):
        value = ''.join(filter(str.isdigit, value))
        if len(value) != 14:
            raise serializers.ValidationError('CNPJ deve conter 14 dígitos.')
        return value

    def create(self, validated_data):
        empresa = super().create(validated_data)
        # Cria personalização padrão automaticamente
        PersonalizacaoEmpresa.objects.create(empresa=empresa)
        return empresa


class EmpresaResumoSerializer(serializers.ModelSerializer):
    """Serializer leve para listagens e vínculos."""
    class Meta:
        model = Empresa
        fields = ['public_id', 'razao_social', 'nome_fantasia', 'status']


class UsuarioEmpresaSerializer(serializers.ModelSerializer):
    usuario_public_id = serializers.UUIDField(source='usuario.public_id', read_only=True)
    usuario_email     = serializers.EmailField(source='usuario.email', read_only=True)
    usuario_nome      = serializers.CharField(source='usuario.nome', read_only=True)
    empresa           = EmpresaResumoSerializer(read_only=True)

    class Meta:
        model = UsuarioEmpresa
        fields = [
            'id', 'usuario_public_id', 'usuario_email',
            'usuario_nome', 'empresa', 'role', 'ativo', 'data_vinculo'
        ]
        read_only_fields = ['data_vinculo']


class CreditoExtraSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditoExtra
        fields = ['id', 'quantidade', 'descricao', 'data_compra']
        read_only_fields = ['data_compra']

    def validate_quantidade(self, value):
        if value <= 0:
            raise serializers.ValidationError('Quantidade deve ser maior que zero.')
        return value
```

---

## Views

### Views — Usuários

**Arquivo:** `apps/usuarios/views.py`

```python
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.core.permissions import IsSuperAdmin
from .models import Usuario
from .serializers import UsuarioSerializer, CriarUsuarioSerializer, AlterarSenhaSerializer


class CriarUsuarioView(generics.CreateAPIView):
    """Apenas superadmin pode criar usuários diretamente."""
    serializer_class = CriarUsuarioSerializer
    permission_classes = [IsSuperAdmin]


class ListarUsuariosView(generics.ListAPIView):
    """Apenas superadmin pode listar todos os usuários."""
    serializer_class = UsuarioSerializer
    permission_classes = [IsSuperAdmin]
    queryset = Usuario.objects.all().order_by('nome')


class MeuPerfilView(generics.RetrieveUpdateAPIView):
    """Usuário autenticado consulta e edita o próprio perfil."""
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class AlterarSenhaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AlterarSenhaSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Senha alterada com sucesso.'}, status=status.HTTP_200_OK)
```

---

### Views — Empresas

**Arquivo:** `apps/empresas/views.py`

```python
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from apps.core.permissions import IsSuperAdmin, IsEmpresaAdmin, IsMembroEmpresa
from .models import Empresa, UsuarioEmpresa, CreditoExtra
from .serializers import (
    EmpresaSerializer, UsuarioEmpresaSerializer,
    CreditoExtraSerializer, PersonalizacaoSerializer
)


class EmpresaListCreateView(generics.ListCreateAPIView):
    serializer_class = EmpresaSerializer
    permission_classes = [IsSuperAdmin]
    queryset = Empresa.objects.select_related('personalizacao').order_by('razao_social')


class EmpresaDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = EmpresaSerializer
    permission_classes = [IsSuperAdmin]
    queryset = Empresa.objects.select_related('personalizacao')
    lookup_field = 'public_id'


class MinhaEmpresaView(generics.RetrieveAPIView):
    """Usuário consulta dados da própria empresa."""
    serializer_class = EmpresaSerializer
    permission_classes = [IsMembroEmpresa]

    def get_object(self):
        return get_object_or_404(
            Empresa.objects.select_related('personalizacao'),
            public_id=self.kwargs['empresa_public_id']
        )


class PersonalizacaoEmpresaView(generics.RetrieveUpdateAPIView):
    """Admin da empresa pode editar a personalização."""
    serializer_class = PersonalizacaoSerializer
    permission_classes = [IsEmpresaAdmin]

    def get_object(self):
        empresa = get_object_or_404(Empresa, public_id=self.kwargs['empresa_public_id'])
        return empresa.personalizacao


class EmpresaUsuariosView(generics.ListAPIView):
    """Lista usuários vinculados à empresa."""
    serializer_class = UsuarioEmpresaSerializer
    permission_classes = [IsEmpresaAdmin]

    def get_queryset(self):
        return UsuarioEmpresa.objects.filter(
            empresa__public_id=self.kwargs['empresa_public_id']
        ).select_related('usuario', 'empresa')


class VincularUsuarioEmpresaView(APIView):
    """Superadmin vincula um usuário a uma empresa."""
    permission_classes = [IsSuperAdmin]

    def post(self, request, empresa_public_id):
        empresa = get_object_or_404(Empresa, public_id=empresa_public_id)
        usuario_public_id = request.data.get('usuario_public_id')
        role = request.data.get('role', UsuarioEmpresa.Role.OPERADOR)

        from apps.usuarios.models import Usuario
        usuario = get_object_or_404(Usuario, public_id=usuario_public_id)

        vinculo, created = UsuarioEmpresa.objects.get_or_create(
            usuario=usuario,
            empresa=empresa,
            defaults={'role': role}
        )

        if not created:
            return Response(
                {'detail': 'Usuário já vinculado a esta empresa.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(UsuarioEmpresaSerializer(vinculo).data, status=status.HTTP_201_CREATED)


class AdicionarCreditoView(APIView):
    """Superadmin adiciona créditos extras à empresa."""
    permission_classes = [IsSuperAdmin]

    def post(self, request, empresa_public_id):
        empresa = get_object_or_404(Empresa, public_id=empresa_public_id)
        serializer = CreditoExtraSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        CreditoExtra.objects.create(empresa=empresa, **serializer.validated_data)
        empresa.creditos_extras += serializer.validated_data['quantidade']
        empresa.save(update_fields=['creditos_extras'])
        return Response(
            {'cota_disponivel': empresa.cota_disponivel},
            status=status.HTTP_200_OK
        )
```

---

## URLs

### `core/urls.py`

```python
from django.urls import path, include
from django.conf import settings

urlpatterns = [
    path('api/auth/',     include('apps.usuarios.urls')),
    path('api/usuarios/', include('apps.usuarios.urls')),
    path('api/empresas/', include('apps.empresas.urls')),
]

if settings.DEBUG:
    from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
    urlpatterns += [
        path('api/schema/', SpectacularAPIView.as_view(),                      name='schema'),
        path('api/docs/',   SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    ]
```

### `apps/usuarios/urls.py`

```python
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import CriarUsuarioView, ListarUsuariosView, MeuPerfilView, AlterarSenhaView

urlpatterns = [
    path('login/',    TokenObtainPairView.as_view(), name='token_obtain'),
    path('refresh/',  TokenRefreshView.as_view(),    name='token_refresh'),
    path('criar/',    CriarUsuarioView.as_view(),    name='criar_usuario'),
    path('',          ListarUsuariosView.as_view(),  name='listar_usuarios'),
    path('me/',       MeuPerfilView.as_view(),       name='meu_perfil'),
    path('me/senha/', AlterarSenhaView.as_view(),    name='alterar_senha'),
]
```

### `apps/empresas/urls.py`

```python
from django.urls import path
from .views import (
    EmpresaListCreateView, EmpresaDetailView, MinhaEmpresaView,
    PersonalizacaoEmpresaView, EmpresaUsuariosView,
    VincularUsuarioEmpresaView, AdicionarCreditoView
)

urlpatterns = [
    path('',                                          EmpresaListCreateView.as_view(),     name='empresa_list'),
    path('<uuid:empresa_public_id>/',                 EmpresaDetailView.as_view(),         name='empresa_detail'),
    path('<uuid:empresa_public_id>/minha/',           MinhaEmpresaView.as_view(),          name='minha_empresa'),
    path('<uuid:empresa_public_id>/personalizacao/',  PersonalizacaoEmpresaView.as_view(), name='personalizacao'),
    path('<uuid:empresa_public_id>/usuarios/',        EmpresaUsuariosView.as_view(),       name='empresa_usuarios'),
    path('<uuid:empresa_public_id>/usuarios/vincular/', VincularUsuarioEmpresaView.as_view(), name='vincular_usuario'),
    path('<uuid:empresa_public_id>/creditos/',        AdicionarCreditoView.as_view(),      name='adicionar_credito'),
]
```

---

## Settings

Pontos relevantes do `settings.py`:

```python
INSTALLED_APPS = [
    ...
    'rest_framework',
    'corsheaders',
    'drf_spectacular',
    'apps.usuarios',
    'apps.empresas',
]

AUTH_USER_MODEL = 'usuarios.Usuario'

REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}
```

---

## Resumo dos Endpoints

| Método | Endpoint | Permissão | Descrição |
|---|---|---|---|
| POST | `/api/auth/login/` | Público | Login — retorna JWT |
| POST | `/api/auth/refresh/` | Público | Renova access token |
| POST | `/api/usuarios/criar/` | SuperAdmin | Cria novo usuário |
| GET | `/api/usuarios/` | SuperAdmin | Lista todos os usuários |
| GET/PUT | `/api/usuarios/me/` | Autenticado | Consulta/edita próprio perfil |
| POST | `/api/usuarios/me/senha/` | Autenticado | Altera própria senha |
| GET/POST | `/api/empresas/` | SuperAdmin | Lista/cria empresas |
| GET/PUT | `/api/empresas/{public_id}/` | SuperAdmin | Detalhe/edita empresa |
| GET | `/api/empresas/{public_id}/minha/` | Membro | Consulta própria empresa |
| GET/PUT | `/api/empresas/{public_id}/personalizacao/` | Admin Empresa | Edita personalização |
| GET | `/api/empresas/{public_id}/usuarios/` | Admin Empresa | Lista usuários da empresa |
| POST | `/api/empresas/{public_id}/usuarios/vincular/` | SuperAdmin | Vincula usuário à empresa |
| POST | `/api/empresas/{public_id}/creditos/` | SuperAdmin | Adiciona créditos extras |
