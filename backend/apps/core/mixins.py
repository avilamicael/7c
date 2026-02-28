# apps/core/mixins.py

class NormalizarTextoMixin:
    campos_lower = []

    def validate(self, attrs):
        for campo in self.campos_lower:
            if campo in attrs and attrs[campo]:
                attrs[campo] = attrs[campo].lower().strip()
        return super().validate(attrs)