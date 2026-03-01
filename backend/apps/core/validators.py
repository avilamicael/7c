from django.core.exceptions import ValidationError
import re

def validar_cnpj(cnpj: str):
    cnpj = "".join(filter(str.isdigit, cnpj))

    if len(cnpj) != 14 or cnpj == cnpj[0] * 14:
        raise ValidationError("CNPJ inválido.")

    def calcular_digito(cnpj, pesos):
        total = sum(int(d) * p for d, p in zip(cnpj, pesos))
        resto = total % 11
        return 0 if resto < 2 else 11 - resto

    pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

    if int(cnpj[12]) != calcular_digito(cnpj[:12], pesos1):
        raise ValidationError("CNPJ inválido.")
    if int(cnpj[13]) != calcular_digito(cnpj[:13], pesos2):
        raise ValidationError("CNPJ inválido.")
    
def validar_cpf(cpf: str) -> bool:
    cpf = "".join(filter(str.isdigit, cpf))
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False

    def calc(cpf, n):
        total = sum(int(d) * w for d, w in zip(cpf, range(n, 1, -1)))
        r = (total * 10) % 11
        return 0 if r == 10 else r

    return calc(cpf, 10) == int(cpf[9]) and calc(cpf, 11) == int(cpf[10])

def validar_telefone(valor: str):
    if not re.fullmatch(r"\d{10,11}", valor):
        raise ValidationError("Telefone deve conter 10 ou 11 dígitos numéricos.")

def validar_cor_hex(valor: str):
    if not re.fullmatch(r"#[0-9A-Fa-f]{6}", valor):
        raise ValidationError("Cor deve estar no formato hexadecimal (#RRGGBB).")

