# Sistema de Notificações

## Visão Geral

O sistema de notificações foi construído para ser genérico e extensível. Um único conjunto de models e infraestrutura serve qualquer módulo do sistema (Tarefas, Kanban, Financeiro, etc.) e qualquer canal de entrega (Web, E-mail, WhatsApp, Telegram).

---

## Modelos

### `Notificacao`

Representa **o evento** — o que aconteceu, de onde veio e qual o conteúdo.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `empresa` | FK | Escopo de isolamento |
| `content_type` + `object_id` | GenericFK | Origem do evento (Tarefa, KanbanCard, etc.) |
| `tipo` | TextChoices | Identifica o evento (`TAREFA_ATRIBUIDA`, `KANBAN_CARD_MOVIDO`, etc.) |
| `payload` | JSONField | Dados para renderização — estrutura varia por tipo |
| `data_criacao` | DateTimeField | Timestamp do evento |

Uma `Notificacao` é criada uma única vez por evento, independente de quantos usuários precisam ser notificados.

---

### `NotificacaoDestinatario`

Representa **a entrega** — quem deve receber, por qual canal, e qual o estado atual.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `notificacao` | FK | Evento ao qual pertence |
| `usuario` | FK | Quem deve receber |
| `canal` | TextChoices | `WEB`, `EMAIL`, `WHATSAPP`, `TELEGRAM` |
| `status` | TextChoices | `PENDENTE` → `ENVIADA` ou `FALHOU` |
| `lida` | BooleanField | Estado de leitura individual |
| `tentativas` | SmallInt | Contador de tentativas de entrega |
| `data_envio` | DateTimeField | Quando foi entregue |
| `data_leitura` | DateTimeField | Quando o usuário leu |

Uma notificação para 10 usuários = 1 `Notificacao` + 10 `NotificacaoDestinatario`.

**Constraint:** `(notificacao, usuario, canal)` é único — impossível criar duplicata.

---

## Payload por tipo

O `payload` é um `JSONField` livre. Cada tipo define sua própria estrutura que os workers e o frontend sabem interpretar.

```json
// TAREFA_ATRIBUIDA
{
  "tarefa_id": "uuid",
  "titulo": "Revisar proposta",
  "atribuido_por": "Maria Silva",
  "prioridade": "ALTA",
  "vencimento": "2026-03-10T14:00:00"
}

// TAREFA_CONCLUIDA
{
  "tarefa_id": "uuid",
  "titulo": "Revisar proposta",
  "concluida_em": "2026-03-08T10:30:00"
}

// TAREFA_LEMBRETE
{
  "tarefa_id": "uuid",
  "titulo": "Revisar proposta",
  "vencimento": "2026-03-10T14:00:00"
}

// TAREFA_REAGENDADA
{
  "tarefa_id": "uuid",
  "titulo": "Revisar proposta",
  "data_anterior": "2026-03-08T14:00:00",
  "nova_data": "2026-03-10T14:00:00"
}

// KANBAN_CARD_MOVIDO
{
  "card_id": "uuid",
  "card_titulo": "Implementar login",
  "coluna_anterior": "Em progresso",
  "coluna_atual": "Concluído",
  "movido_por": "João"
}
```

---

## NotificacaoService

Localizado em `apps/core/services.py`. É a única forma de criar notificações no sistema — nenhuma view ou signal cria `Notificacao` diretamente.

### Funções disponíveis

```python
from apps.core import services

services.tarefa_atribuida(tarefa)
services.tarefa_concluida(tarefa)
services.tarefa_lembrete(tarefa)
services.tarefa_reagendada(tarefa, data_anterior)
services.card_movido(card, coluna_anterior, movido_por)
```

### O que cada chamada faz internamente

```
services.tarefa_atribuida(tarefa)
    ↓
1. ContentType.get_for_model(tarefa)
2. Notificacao.objects.create(...)
3. NotificacaoDestinatario.objects.bulk_create([...])
4. entregar_notificacao.delay(notificacao.pk)  ← Celery, não bloqueia
```

### Como adicionar um novo evento

```python
# 1. Adicionar o tipo no model
class Tipo(models.TextChoices):
    MEU_NOVO_EVENTO = "MEU_NOVO_EVENTO", "Descrição"

# 2. Criar a função no service
def meu_novo_evento(objeto):
    notificacao = _criar_notificacao(
        empresa=objeto.empresa,
        origem=objeto,
        tipo=Notificacao.Tipo.MEU_NOVO_EVENTO,
        payload={"chave": "valor"},
    )
    _criar_destinatarios(notificacao, [usuario_id])
    _despachar(notificacao)

# 3. Chamar na view/serializer
services.meu_novo_evento(objeto)
```

---

## Fluxo de entrega

```
View/Serializer
      ↓
services.tarefa_atribuida(tarefa)          [síncrono — ~2ms]
      ↓
Cria Notificacao + NotificacaoDestinatario
      ↓
entregar_notificacao.delay(id)             [enfileira no Redis]
      ↓
Request retorna para o usuário             [sem esperar entrega]

════════════════════════════════════════   [assíncrono a partir daqui]

Celery Worker pega da fila
      ↓
Busca NotificacaoDestinatario(status=PENDENTE)
      ↓
canal=WEB      → channel_layer.group_send() → WebSocket → browser
canal=EMAIL    → [futuro]
canal=WHATSAPP → [futuro]
canal=TELEGRAM → [futuro]
      ↓
status=ENVIADA, data_envio=agora
```

### Em caso de falha

```
Entrega falha
      ↓
status=FALHOU, tentativas++
      ↓
tentativas < 3 → retry após 60s
tentativas >= 3 → para, registra no log
```

---

## Celery Beat — Lembretes

Uma task periódica roda a cada 5 minutos verificando tarefas que precisam de lembrete:

```python
# apps/core/tasks.py
@shared_task
def processar_lembretes():
    tarefas = Tarefa.objects.filter(
        lembrete_em__lte=agora,
        lembrete_notificado=False,
        status__in=[PENDENTE, EM_PROGRESSO],
    )
    for tarefa in tarefas:
        services.tarefa_lembrete(tarefa)
        tarefa.lembrete_notificado = True
        tarefa.save(update_fields=["lembrete_notificado"])
```

O campo `lembrete_notificado` na `Tarefa` garante que o lembrete não seja enviado mais de uma vez mesmo se o beat rodar múltiplas vezes.

---

## WebSocket — Canal WEB

### Conexão

```
ws://dominio.com/ws/notificacoes/?token=<jwt_access_token>
```

Ao conectar, o servidor envia automaticamente as 50 últimas notificações não lidas.

### Mensagens recebidas pelo frontend

```json
// Ao conectar — notificações pendentes
{ "tipo": "nao_lidas", "data": [...] }

// Quando chega uma nova notificação
{ "tipo": "nova_notificacao", "data": { "id": 1, "tipo": "TAREFA_ATRIBUIDA", "payload": {...}, "lida": false, "data_criacao": "..." } }
```

### Ações enviadas pelo frontend

```json
// Marcar uma notificação como lida
{ "acao": "marcar_lida", "destinatario_id": 42 }

// Marcar todas como lidas
{ "acao": "marcar_todas_lidas" }
```

---

## Canais futuros

Para ativar um novo canal, três passos:

**1.** Criar `NotificacaoDestinatario` com o canal desejado no service:
```python
_criar_destinatarios(notificacao, usuarios, canais=[Canal.WEB, Canal.EMAIL])
```

**2.** Descomentar o `elif` na task:
```python
elif dest.canal == NotificacaoDestinatario.Canal.EMAIL:
    _entregar_email(dest)
```

**3.** Implementar a função de entrega:
```python
def _entregar_email(dest):
    # lê dest.notificacao.payload
    # monta o e-mail
    # envia via SMTP/SendGrid/etc.
```

Nenhuma outra parte do sistema precisa ser alterada.

---

## Arquivos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `apps/core/models.py` | `Notificacao` e `NotificacaoDestinatario` |
| `apps/core/services.py` | Criação de notificações por evento |
| `apps/core/tasks.py` | Entrega assíncrona e beat de lembretes |
| `apps/core/consumers.py` | WebSocket — entrega e leitura em tempo real |
| `apps/core/routing.py` | Rota WebSocket `ws/notificacoes/` |
| `apps/core/utils.py` | `get_membros_empresa()` |
| `core/celery.py` | Configuração e beat schedule |