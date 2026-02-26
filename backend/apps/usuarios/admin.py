# apps/usuarios/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from django import forms
from .models import Usuario


class UsuarioCreationForm(UserCreationForm):
    class Meta:
        model = Usuario
        fields = ['email', 'nome', 'telefone']


class UsuarioChangeForm(UserChangeForm):
    class Meta:
        model = Usuario
        fields = ['email', 'nome', 'telefone', 'is_active', 'is_staff', 'is_superuser']


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    form = UsuarioChangeForm
    add_form = UsuarioCreationForm

    list_display = ['email', 'nome', 'telefone', 'is_active', 'is_staff', 'date_joined']
    list_filter = ['is_active', 'is_staff', 'is_superuser']
    search_fields = ['email', 'nome']
    ordering = ['nome']

    fieldsets = (
        ('Credenciais', {'fields': ('email', 'password')}),
        ('Dados Pessoais', {'fields': ('nome', 'telefone')}),
        ('Permissões', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Datas', {'fields': ('date_joined', 'data_atualizacao'), 'classes': ('collapse',)}),
    )

    add_fieldsets = (
        ('Novo Usuário', {
            'fields': ('email', 'nome', 'telefone', 'password1', 'password2', 'is_active', 'is_staff')
        }),
    )

    readonly_fields = ['public_id', 'date_joined', 'data_atualizacao']