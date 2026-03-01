# apps/financeiro/shared/serializers.py

from decimal import Decimal
from django.utils import timezone
from rest_framework import serializers
from apps.core.utils import get_empresa_do_membro
from .models import Categoria, ContaBancaria


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Categoria
        fields = ["id", "nome", "descricao", "ativo"]
        read_only_fields = ["id"]


class ContaBancariaSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source="get_tipo_display", read_only=True)

    class Meta:
        model  = ContaBancaria
        fields = ["id", "banco_nome", "agencia", "conta", "tipo", "tipo_display", "descricao", "ativo"]
        read_only_fields = ["id"]


class RegistrarMovimentoBaseSerializer(serializers.Serializer):
    juros             = serializers.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    multa             = serializers.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    outros_acrescimos = serializers.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    desconto          = serializers.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    conta_bancaria_id = serializers.PrimaryKeyRelatedField(queryset=ContaBancaria.objects.none())
    observacoes       = serializers.CharField(required=False, allow_blank=True, default="")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request:
            empresa = get_empresa_do_membro(request.user)
            self.fields["conta_bancaria_id"].queryset = ContaBancaria.objects.filter(empresa=empresa, ativo=True)

    def _validate_valor(self, value: Decimal, field_name: str) -> Decimal:
        if value <= Decimal("0.00"):
            raise serializers.ValidationError(f"{field_name} deve ser maior que zero.")
        return value

    def _validate_data(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError("Data não pode ser futura.")
        return value

    def validate(self, attrs):
        desconto    = attrs.get("desconto", Decimal("0.00"))
        valor_bruto = self.instance.valor_bruto if self.instance else Decimal("0.00")
        if desconto > valor_bruto:
            raise serializers.ValidationError({"desconto": "Desconto não pode ser maior que o valor bruto."})
        return attrs

    def _aplicar_campos_comuns(self, parcela, data):
        parcela.juros             = data["juros"]
        parcela.multa             = data["multa"]
        parcela.outros_acrescimos = data["outros_acrescimos"]
        parcela.desconto          = data["desconto"]
        parcela.conta_bancaria    = data["conta_bancaria_id"]
        parcela.observacoes       = data.get("observacoes", "")


class BaixaBaseSerializer(serializers.ModelSerializer):
    def _realizar_baixa(self, conta, model_baixa, fk_field, status_cancelada, status_baixa_manual):
        tipo = self.validated_data["tipo"]

        model_baixa.objects.create(
            **{fk_field: conta},
            usuario=self.context["request"].user,
            **self.validated_data,
        )

        novo_status = status_cancelada if tipo == "CANCELAMENTO" else status_baixa_manual
        conta.__class__.objects.filter(pk=conta.pk).update(status=novo_status, status_manual=True)