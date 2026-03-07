# Apresentação do Sistema

---

## 1. Visão Geral

O sistema é uma plataforma de gestão empresarial desenvolvida para agências de viagens e empresas do setor turístico. Ele centraliza em um único lugar tudo o que a empresa precisa para operar: cadastro de clientes, controle financeiro, organização de tarefas e acompanhamento de processos internos.

O problema que ele resolve é simples: sem uma ferramenta integrada, as informações ficam espalhadas em planilhas, anotações e aplicativos diferentes, o que gera retrabalho, esquecimentos e dificuldade para acompanhar o andamento das atividades. O sistema resolve isso reunindo todas as operações em uma interface única, acessível por qualquer membro da equipe com as permissões adequadas.

Ele foi pensado para empresas de pequeno e médio porte que precisam de organização, controle e visibilidade sobre seus processos sem a complexidade de sistemas corporativos grandes.

---

## 2. Principais Funcionalidades do Sistema

### Cadastro de Clientes

O sistema permite cadastrar e gerenciar toda a base de clientes da empresa. Para cada cliente é possível registrar:

- Dados pessoais: nome, data de nascimento e nacionalidade
- Informações de passaporte: número, data de emissão e validade, país emissor
- Documentos: CPF, RG, CNH ou outro documento personalizado
- Contatos: e-mail, telefone próprio ou de terceiros e redes sociais
- Observações livres sobre o cliente

Todos os clientes ficam organizados por empresa, garantindo que cada equipe veja apenas seus próprios registros.

### Cadastro de Fornecedores

O sistema possui um cadastro completo de fornecedores — companhias aéreas, hotéis, operadoras e qualquer outro parceiro comercial. Para cada fornecedor é possível registrar:

- Dados cadastrais: razão social, nome fantasia, CNPJ ou CPF
- Endereço completo com CEP e estado
- Contatos: e-mail, telefone e site
- Dados bancários para pagamentos: banco, agência, conta e chave PIX
- Observações e controle de status (ativo/inativo)

### Controle Financeiro

O módulo financeiro cobre dois lados da operação:

**Contas a Pagar**
Registra todas as obrigações financeiras da empresa com fornecedores. Cada conta pode ser parcelada e o sistema acompanha automaticamente o status de cada parcela (pendente, paga, vencida). Suporta juros, multas, descontos e acréscimos. Registra também notas fiscais vinculadas a cada lançamento.

**Contas a Receber**
Registra os valores que a empresa tem a receber de clientes — seja por serviços prestados ou por comissões sobre vendas. O sistema calcula automaticamente comissões com base em percentual e valor-base definidos. Assim como as contas a pagar, cada conta pode ser parcelada com acompanhamento automático de status.

**Recursos comuns a ambos os módulos:**
- Formas de pagamento: PIX, boleto, cartão, transferência bancária, cheque e dinheiro
- Categorias financeiras personalizáveis por empresa
- Cadastro de contas bancárias da empresa
- Baixa manual, cancelamento e renegociação de dívidas
- Status automático atualizado conforme as parcelas são quitadas

### Controle de Comissões

Dentro do módulo financeiro, existe um tipo específico de conta a receber voltado para comissões. Nele é possível registrar o percentual de comissão acordado com um fornecedor, o valor base sobre o qual ela incide e acompanhar o recebimento dessas comissões de forma separada das demais receitas.

### Gestão de Tarefas

O sistema possui um gerenciador de tarefas completo para organizar as atividades da equipe. Cada tarefa possui:

- Título e descrição detalhada
- Prioridade: Baixa, Média, Alta ou Urgente
- Status: Pendente, Em Progresso, Concluída ou Cancelada
- Responsável: o membro da equipe designado para executar a tarefa
- Data de vencimento
- Lembrete com data e hora específica para notificação

As tarefas podem ser criadas de forma independente ou vinculadas a cartões do Kanban, mantendo tudo sincronizado.

### Sistema Kanban

O Kanban é uma forma visual de organizar o fluxo de trabalho da equipe. O sistema permite criar múltiplos quadros (boards), cada um com colunas personalizadas que representam as etapas de um processo.

**O que é possível configurar:**
- Nome, cor e ordem das colunas
- Limite de itens por coluna (WIP — Work in Progress)
- Ações automáticas por coluna: quando um cartão é movido para uma coluna, o sistema pode automaticamente alterar o status da tarefa vinculada, alterar a prioridade do cartão ou disparar notificações

**Cada cartão do Kanban possui:**
- Título, descrição e prioridade
- Responsável pelo cartão
- Data de vencimento e lembrete com hora
- Vínculo com uma tarefa do sistema

O Kanban suporta arrastar e soltar os cartões entre as colunas diretamente na tela.

### Sistema de Notificações

O sistema envia notificações em tempo real para os usuários diretamente na interface, sem necessidade de atualizar a página. Os eventos que geram notificação incluem:

- Tarefa atribuída a um membro da equipe
- Tarefa concluída
- Tarefa com vencimento chegando
- Lembrete de tarefa disparado no horário configurado
- Tarefa reagendada
- Cartão do Kanban movido de coluna

As notificações podem ser marcadas como lidas individualmente ou todas de uma vez.

### Autenticação de Usuários

O acesso ao sistema é protegido por login com e-mail e senha. Cada usuário possui um perfil com nome, foto, telefone e endereço. Dentro da empresa, os usuários podem ter dois níveis de acesso:

- **Administrador**: acesso completo a todas as configurações e dados
- **Operador**: acesso às funcionalidades operacionais do dia a dia

### Segmentação por Empresa (Multiempresa)

O sistema foi construído para atender múltiplas empresas de forma isolada. Cada empresa possui seus próprios dados de clientes, fornecedores, financeiro, tarefas e Kanban — sem qualquer mistura com dados de outras empresas. Isso permite que o sistema seja disponibilizado como um serviço para diferentes clientes ao mesmo tempo.

Cada empresa pode ser personalizada com cores e logotipo próprios.

### Painel de Acompanhamento (Dashboard)

A tela inicial apresenta um painel com indicadores financeiros da empresa:

- Receita total
- Lucro do mês
- Total de contas a receber
- Total de contas a pagar

O painel também exibe um gráfico de evolução financeira ao longo do tempo. Atualmente os dados exibidos são estáticos e a integração com dados reais está em desenvolvimento.

### Armazenamento de Documentos

O sistema possui a estrutura para armazenar arquivos e documentos vinculados a qualquer registro — seja um cliente, fornecedor, cartão do Kanban ou conta financeira. Esse recurso está implementado na base e será disponibilizado nas telas em breve.

### Registro de Auditoria

Toda ação realizada no sistema — criação, edição, cancelamento, pagamento — fica registrada com a identificação do usuário, data, horário e as informações alteradas. Isso garante rastreabilidade completa de tudo o que acontece na plataforma.

---

## 3. Como o Sistema Funciona no Dia a Dia

Um exemplo de uso típico para uma agência de viagens:

1. **Cadastro do cliente**: ao atender um novo cliente, o atendente cadastra seus dados pessoais, documentos e contatos no sistema.

2. **Organização das tarefas**: para cada solicitação do cliente, uma tarefa é criada e atribuída ao responsável, com prazo e prioridade definidos.

3. **Acompanhamento pelo Kanban**: as tarefas percorrem as etapas do processo — por exemplo: "Solicitação Recebida", "Cotando", "Aguardando Aprovação", "Confirmado", "Encerrado". Ao mover o cartão entre as colunas, o status da tarefa é atualizado automaticamente.

4. **Controle financeiro**: ao fechar um serviço, é registrada a conta a receber do cliente e, se houver fornecedor envolvido, a comissão devida. As contas a pagar com fornecedores também são lançadas e acompanhadas por parcela.

5. **Notificações e lembretes**: o sistema avisa automaticamente os responsáveis sobre tarefas atribuídas, vencimentos próximos e movimentações no Kanban — sem precisar de comunicação manual.

---

## 4. Situação Atual do Sistema

### Funcionalidades já operacionais

- Autenticação com login seguro por e-mail e senha
- Cadastro completo de clientes com documentos e telefones
- Cadastro completo de fornecedores com dados bancários
- Controle de contas a pagar com parcelas e baixas
- Controle de contas a receber com parcelas, comissões e baixas
- Categorias financeiras e contas bancárias personalizáveis
- Gestão de tarefas com prioridade, responsável, prazo e lembrete com hora
- Sistema Kanban com múltiplos boards, colunas personalizadas e ações automáticas
- Notificações em tempo real via WebSocket
- Registro de auditoria de todas as ações
- Gestão de usuários com perfis e papéis (Admin / Operador)
- Personalização visual da empresa (cores e logo)
- Separação total de dados por empresa

### Funcionalidades em desenvolvimento

- Dashboard com dados reais integrados ao financeiro (atualmente com valores de exemplo)
- Tela de visualização e upload de documentos anexados

### Funcionalidades planejadas

- Histórico de viagens por cliente (destinos, frequência, gasto médio)
- Integração com API de passagens para cotação automática
- Envio de notificações por WhatsApp, Telegram e e-mail
- Gateway de pagamento para cobrança pelo uso do sistema
- Disponibilização da plataforma para acesso via internet

---

## 5. Próximas Evoluções do Sistema

### Integração com API de Passagens

O sistema será integrado a APIs externas de pesquisa de passagens aéreas. Isso permitirá consultar disponibilidade e preços diretamente pela plataforma, sem precisar acessar outros sistemas ou sites. A busca poderá ser feita com base nas preferências e no histórico do cliente.

### Automação de Cotações

Com a integração das APIs de passagens, será possível gerar cotações automaticamente para os clientes — incluindo opções de voos, valores e condições — diretamente pelo sistema, agilizando o atendimento e reduzindo o trabalho manual da equipe.

### Gateway de Pagamento

Será integrado um gateway de pagamento para permitir a cobrança pelo uso da plataforma. Isso inclui:

- Planos de acesso com diferentes funcionalidades e limites
- Cobrança mensal automatizada
- Contratação e ativação de novas empresas de forma autônoma

### Disponibilização na Internet

O sistema será preparado para ser acessado por qualquer empresa pela internet, sem necessidade de instalação local. Cada empresa contratante terá seu próprio ambiente isolado, com dados protegidos e personalizados.

### Notificações por WhatsApp, Telegram e E-mail

Além das notificações já disponíveis na interface do sistema, estão planejados envios automáticos por WhatsApp, Telegram e e-mail — para lembretes de tarefas, vencimentos financeiros e outras situações relevantes do dia a dia.

---

## 6. Objetivo do Sistema

O sistema tem como objetivo centralizar toda a operação de uma agência de viagens em uma única plataforma: gestão de clientes, controle financeiro, organização de tarefas e acompanhamento de processos. A proposta é eliminar o uso de planilhas e ferramentas desconectadas, reduzir o risco de erros e esquecimentos, e dar à equipe visibilidade clara sobre tudo o que está acontecendo na empresa.

Com a automação de rotinas como atualização de status, envio de lembretes e geração de cotações — que chegará nas próximas versões — o sistema busca aumentar a produtividade da equipe e melhorar a experiência oferecida ao cliente final.
