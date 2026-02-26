from django.contrib import admin
from django.utils.html import format_html
from .models import Empresa, PersonalizacaoEmpresa, CreditoExtra, UsuarioEmpresa


class PersonalizacaoInline(admin.StackedInline):
    model = PersonalizacaoEmpresa
    extra = 0
    fields = ['cor_primaria', 'cor_secundaria', 'logo']


class CreditoExtraInline(admin.TabularInline):
    model = CreditoExtra
    extra = 0
    fields = ['quantidade', 'descricao', 'data_compra']
    readonly_fields = ['data_compra']
    ordering = ['-data_compra']


class UsuarioEmpresaInline(admin.TabularInline):
    model = UsuarioEmpresa
    extra = 0
    fields = ['usuario', 'role', 'ativo', 'data_vinculo']
    readonly_fields = ['data_vinculo']


@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    inlines = [PersonalizacaoInline, UsuarioEmpresaInline, CreditoExtraInline]

    list_display = [
        'razao_social', 'cnpj', 'status', 'cota_mensal',
        'consumo_mes', 'creditos_extras', 'cota_disponivel_display', 'data_cadastro'
    ]
    list_filter = ['status']
    search_fields = ['razao_social', 'nome_fantasia', 'cnpj', 'email']
    ordering = ['razao_social']

    fieldsets = (
        ('Identificação', {
            'fields': ('public_id', 'cnpj', 'razao_social', 'nome_fantasia', 'status')
        }),
        ('Contato', {
            'fields': ('email', 'telefone')
        }),
        ('Cotas', {
            'fields': ('cota_mensal', 'creditos_extras', 'consumo_mes', 'mes_referencia')
        }),
        ('Datas', {
            'fields': ('data_cadastro', 'data_atualizacao'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ['public_id', 'data_cadastro', 'data_atualizacao']

    def cota_disponivel_display(self, obj):
        valor = obj.cota_disponivel
        cor = 'green' if valor > 0 else 'red'
        return format_html('<b style="color:{}">{}</b>', cor, valor)

    cota_disponivel_display.short_description = 'Cota Disponível'

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        # Garante que PersonalizacaoEmpresa é criada se não existir
        PersonalizacaoEmpresa.objects.get_or_create(empresa=obj)