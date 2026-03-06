# apps/financeiro/contas_pagar/serializers.py

from decimal import Decimal
from rest_framework import serializers
from apps.core.utils import get_empresa_do_membro
from apps.financeiro.shared.serializers import RegistrarMovimentoBaseSerializer, BaixaBaseSerializer
from apps.financeiro.shared.models import Categoria
from apps.fornecedores.models import Fornecedor
from .models import ContaPagar, NotaFiscalCP, ParcelaContaPagar, BaixaContaPagar


class EmpresaSlugRelatedField(serializers.SlugRelatedField):
    """
    SlugRelatedField que restringe o queryset à empresa do usuário autenticado.
    Impede referências cruzadas entre empresas sem expor PKs internos.
    """

    def get_queryset(self):
        request = self.context.get("request")
        empresa = get_empresa_do_membro(request.user)
        return self.queryset.filter(empresa=empresa)


class NotaFiscalCPSerializer(serializers.ModelSerializer):
    class Meta:
        model  = NotaFiscalCP
        fields = ["id", "numero", "serie"]
        read_only_fields = ["id"]


class ParcelaContaPagarSerializer(serializers.ModelSerializer):
    status_display      = serializers.CharField(source="get_status_display", read_only=True)
    conta_bancaria_nome = serializers.CharField(source="conta_bancaria.__str__", read_only=True)

    class Meta:
        model  = ParcelaContaPagar
        fields = [
            "id", "numero_parcela", "cod_barras",
            "data_competencia", "data_movimentacao", "data_vencimento", "data_pagamento",
            "valor_bruto", "juros", "multa", "outros_acrescimos", "desconto",
            "valor_pago", "saldo",
            "conta_bancaria", "conta_bancaria_nome",
            "status", "status_display", "observacoes",
        ]
        read_only_fields = ["id", "valor_pago", "saldo", "status"]


class RegistrarPagamentoSerializer(RegistrarMovimentoBaseSerializer):
    data_pagamento = serializers.DateField()
    valor_pago     = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate_valor_pago(self, value: Decimal) -> Decimal:
        return self._validate_valor(value, "Valor pago")

    def validate_data_pagamento(self, value):
        return self._validate_data(value)

    def save(self, **kwargs):
        parcela: ParcelaContaPagar = self.instance
        data = self.validated_data
        parcela.data_pagamento = data["data_pagamento"]
        parcela.valor_pago     = data["valor_pago"]
        self._aplicar_campos_comuns(parcela, data)
        parcela.save()
        return parcela


class ContaPagarWriteSerializer(serializers.ModelSerializer):
    notas_fiscais = NotaFiscalCPSerializer(many=True, required=False)
    parcelas      = ParcelaContaPagarSerializer(many=True)
    fornecedor    = EmpresaSlugRelatedField(
        slug_field="public_id",
        queryset=Fornecedor.objects.all(),
    )
    categoria     = EmpresaSlugRelatedField(
        slug_field="public_id",
        queryset=Categoria.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model  = ContaPagar
        fields = [
            "fornecedor", "categoria", "numero_documento", "descricao",
            "forma_pagamento", "total_parcelas", "data_competencia",
            "notas_fiscais", "parcelas",
        ]

    def validate(self, attrs):
        parcelas       = attrs.get("parcelas", [])
        total_parcelas = attrs.get("total_parcelas", 1)
        if len(parcelas) != total_parcelas:
            raise serializers.ValidationError({"parcelas": f"Informe exatamente {total_parcelas} parcela(s)."})
        for i, p in enumerate(parcelas, start=1):
            if p.get("numero_parcela") != i:
                raise serializers.ValidationError({"parcelas": f"Parcela {i}: numero_parcela deve ser {i}."})
        # Validação de empresa removida: EmpresaSlugRelatedField já restringe o queryset
        return attrs

    def create(self, validated_data):
        notas_data    = validated_data.pop("notas_fiscais", [])
        parcelas_data = validated_data.pop("parcelas")
        empresa       = get_empresa_do_membro(self.context["request"].user)

        conta = ContaPagar.objects.create(
            **validated_data,
            empresa=empresa,
            criado_por=self.context["request"].user,
        )
        for nota in notas_data:
            NotaFiscalCP.objects.create(conta_pagar=conta, **nota)
        for parcela in parcelas_data:
            ParcelaContaPagar.objects.create(conta_pagar=conta, **parcela)

        return conta

    def update(self, instance, validated_data):
        notas_data    = validated_data.pop("notas_fiscais", None)
        parcelas_data = validated_data.pop("parcelas", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if notas_data is not None:
            instance.notas_fiscais.all().delete()
            for nota in notas_data:
                NotaFiscalCP.objects.create(conta_pagar=instance, **nota)

        if parcelas_data is not None:
            instance.parcelas.all().delete()
            for parcela in parcelas_data:
                ParcelaContaPagar.objects.create(conta_pagar=instance, **parcela)

        return instance


class ContaPagarReadSerializer(serializers.ModelSerializer):
    status_display          = serializers.CharField(source="get_status_display", read_only=True)
    forma_pagamento_display = serializers.CharField(source="get_forma_pagamento_display", read_only=True)
    fornecedor_public_id    = serializers.UUIDField(source="fornecedor.public_id", read_only=True)
    fornecedor_nome         = serializers.CharField(source="fornecedor.razao_social", read_only=True)
    categoria_public_id     = serializers.UUIDField(source="categoria.public_id", read_only=True, default=None)
    categoria_nome          = serializers.CharField(source="categoria.nome", read_only=True)
    notas_fiscais           = NotaFiscalCPSerializer(many=True, read_only=True)
    parcelas                = ParcelaContaPagarSerializer(many=True, read_only=True)

    class Meta:
        model  = ContaPagar
        fields = [
            "public_id",
            "fornecedor_public_id", "fornecedor_nome",
            "categoria_public_id",  "categoria_nome",
            "numero_documento", "descricao",
            "forma_pagamento", "forma_pagamento_display",
            "total_parcelas",
            "status", "status_display", "status_manual",
            "data_competencia", "data_cadastro", "data_atualizacao",
            "notas_fiscais", "parcelas",
        ]

class BaixaContaPagarSerializer(BaixaBaseSerializer):
    class Meta:
        model  = BaixaContaPagar
        fields = ["id", "tipo", "motivo", "data_baixa"]
        read_only_fields = ["id", "data_baixa"]

    def validate_tipo(self, value):
        allowed = [BaixaContaPagar.Tipo.CANCELAMENTO, BaixaContaPagar.Tipo.BAIXA_MANUAL]
        if value not in allowed:
            raise serializers.ValidationError("Use o endpoint de renegociação para este tipo.")
        return value

    def save(self, **kwargs):
        self._realizar_baixa(
            conta              = self.context["conta_pagar"],
            model_baixa        = BaixaContaPagar,
            fk_field           = "conta_pagar",
            status_cancelada   = ContaPagar.Status.CANCELADA,
            status_baixa_manual= ContaPagar.Status.BAIXA_MANUAL,
        )