# apps/financeiro/contas_receber/serializers.py

from decimal import Decimal
from rest_framework import serializers
from apps.core.utils import get_empresa_do_membro
from apps.financeiro.shared.serializers import RegistrarMovimentoBaseSerializer, BaixaBaseSerializer
from apps.financeiro.shared.models import Categoria
from apps.fornecedores.models import Fornecedor
from apps.clientes.models import Cliente
from .models import ContaReceber, ParcelaContaReceber, BaixaContaReceber


class EmpresaSlugRelatedField(serializers.SlugRelatedField):
    """SlugRelatedField que restringe o queryset à empresa do usuário autenticado."""

    def get_queryset(self):
        request = self.context.get("request")
        empresa = get_empresa_do_membro(request.user)
        return self.queryset.filter(empresa=empresa)


class ParcelaContaReceberSerializer(serializers.ModelSerializer):
    status_display      = serializers.CharField(source="get_status_display", read_only=True)
    conta_bancaria_nome = serializers.CharField(source="conta_bancaria.__str__", read_only=True)

    class Meta:
        model  = ParcelaContaReceber
        fields = [
            "id", "numero_parcela",
            "data_competencia", "data_vencimento", "data_recebimento",
            "valor_bruto", "juros", "multa", "outros_acrescimos", "desconto",
            "valor_recebido", "saldo",
            "conta_bancaria", "conta_bancaria_nome",
            "status", "status_display", "observacoes",
        ]
        read_only_fields = ["id", "valor_recebido", "saldo", "status"]


class RegistrarRecebimentoSerializer(RegistrarMovimentoBaseSerializer):
    data_recebimento = serializers.DateField()
    valor_recebido   = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate_valor_recebido(self, value: Decimal) -> Decimal:
        return self._validate_valor(value, "Valor recebido")

    def validate_data_recebimento(self, value):
        return self._validate_data(value)

    def save(self, **kwargs):
        parcela: ParcelaContaReceber = self.instance
        data = self.validated_data
        parcela.data_recebimento = data["data_recebimento"]
        parcela.valor_recebido   = data["valor_recebido"]
        self._aplicar_campos_comuns(parcela, data)
        parcela.save()
        return parcela


class ContaReceberWriteSerializer(serializers.ModelSerializer):
    parcelas   = ParcelaContaReceberSerializer(many=True)
    cliente    = EmpresaSlugRelatedField(
        slug_field="public_id",
        queryset=Cliente.objects.all(),
        required=False,
        allow_null=True,
    )
    fornecedor = EmpresaSlugRelatedField(
        slug_field="public_id",
        queryset=Fornecedor.objects.all(),
        required=False,
        allow_null=True,
    )
    categoria  = EmpresaSlugRelatedField(
        slug_field="public_id",
        queryset=Categoria.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model  = ContaReceber
        fields = [
            "tipo",
            "cliente", "fornecedor",
            "percentual_comissao", "valor_base_comissao",
            "categoria", "numero_documento", "descricao",
            "forma_pagamento", "total_parcelas", "data_competencia",
            "parcelas",
        ]

    def validate(self, attrs):
        tipo       = attrs.get("tipo", ContaReceber.Tipo.SERVICO)
        cliente    = attrs.get("cliente")
        fornecedor = attrs.get("fornecedor")

        if tipo == ContaReceber.Tipo.SERVICO:
            if not cliente:
                raise serializers.ValidationError({"cliente": "Obrigatório para tipo Serviço."})
            if fornecedor:
                raise serializers.ValidationError({"fornecedor": "Não deve ser preenchido para tipo Serviço."})
        elif tipo == ContaReceber.Tipo.COMISSAO:
            if not fornecedor:
                raise serializers.ValidationError({"fornecedor": "Obrigatório para tipo Comissão."})
            if cliente:
                raise serializers.ValidationError({"cliente": "Não deve ser preenchido para tipo Comissão."})
            if not attrs.get("percentual_comissao"):
                raise serializers.ValidationError({"percentual_comissao": "Obrigatório para tipo Comissão."})
            if not attrs.get("valor_base_comissao"):
                raise serializers.ValidationError({"valor_base_comissao": "Obrigatório para tipo Comissão."})

        parcelas       = attrs.get("parcelas", [])
        total_parcelas = attrs.get("total_parcelas", 1)
        if len(parcelas) != total_parcelas:
            raise serializers.ValidationError({"parcelas": f"Informe exatamente {total_parcelas} parcela(s)."})
        for i, p in enumerate(parcelas, start=1):
            if p.get("numero_parcela") != i:
                raise serializers.ValidationError({"parcelas": f"Parcela {i}: numero_parcela deve ser {i}."})

        return attrs

    def create(self, validated_data):
        parcelas_data = validated_data.pop("parcelas")
        empresa       = get_empresa_do_membro(self.context["request"].user)

        conta = ContaReceber.objects.create(
            **validated_data,
            empresa=empresa,
            criado_por=self.context["request"].user,
        )
        for parcela in parcelas_data:
            ParcelaContaReceber.objects.create(conta_receber=conta, **parcela)

        return conta


class ContaReceberReadSerializer(serializers.ModelSerializer):
    status_display          = serializers.CharField(source="get_status_display", read_only=True)
    tipo_display            = serializers.CharField(source="get_tipo_display", read_only=True)
    forma_pagamento_display = serializers.CharField(source="get_forma_pagamento_display", read_only=True)
    cliente_public_id       = serializers.UUIDField(source="cliente.public_id", read_only=True, default=None)
    cliente_nome            = serializers.SerializerMethodField()
    fornecedor_public_id    = serializers.UUIDField(source="fornecedor.public_id", read_only=True, default=None)
    fornecedor_nome         = serializers.CharField(source="fornecedor.razao_social", read_only=True)
    categoria_public_id     = serializers.UUIDField(source="categoria.public_id", read_only=True, default=None)
    categoria_nome          = serializers.CharField(source="categoria.nome", read_only=True)
    parcelas                = ParcelaContaReceberSerializer(many=True, read_only=True)

    class Meta:
        model  = ContaReceber
        fields = [
            "public_id",
            "tipo", "tipo_display",
            "cliente_public_id",    "cliente_nome",
            "fornecedor_public_id", "fornecedor_nome",
            "percentual_comissao", "valor_base_comissao",
            "categoria_public_id",  "categoria_nome",
            "numero_documento", "descricao",
            "forma_pagamento", "forma_pagamento_display",
            "total_parcelas",
            "status", "status_display", "status_manual",
            "data_competencia", "data_cadastro", "data_atualizacao",
            "parcelas",
        ]

    def get_cliente_nome(self, obj) -> str | None:
        if obj.cliente:
            return f"{obj.cliente.nome} {obj.cliente.sobrenome}"
        return None


class BaixaContaReceberSerializer(BaixaBaseSerializer):
    class Meta:
        model  = BaixaContaReceber
        fields = ["id", "tipo", "motivo", "data_baixa"]
        read_only_fields = ["id", "data_baixa"]

    def save(self, **kwargs):
        self._realizar_baixa(
            conta               = self.context["conta_receber"],
            model_baixa         = BaixaContaReceber,
            fk_field            = "conta_receber",
            status_cancelada    = ContaReceber.Status.CANCELADA,
            status_baixa_manual = ContaReceber.Status.BAIXA_MANUAL,
        )