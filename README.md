# Projem Flow CRM — Base de Produto Revisada v2

Base funcional e modular de CRM comercial, preparada para receber autenticação definitiva, banco de dados e integrações externas sem reconstruir as páginas.

## Acesso demonstrativo

No modo local, o CRM abre diretamente no perfil **Administrador de demonstração**. Não existe tela de login na abertura.

Dentro do menu de perfil é possível alternar entre Administrador, Gerente, Comercial e SDR para validar os diferentes níveis de acesso. Esse seletor existe somente no ambiente demonstrativo e desaparece quando `VITE_DATA_PROVIDER=rest`.

## O que funciona no modo local

Os fluxos abaixo usam um gateway local assíncrono e persistência no navegador:

- dashboard com indicadores, tarefas, origens e funil selecionável;
- múltiplos funis, etapas e regras de acesso por usuário;
- Kanban com drag and drop, validação de etapa e histórico de movimentação;
- cadastro e edição de leads, validações, deduplicação por telefone e campos personalizados;
- etiquetas coloridas, prioridade, temperatura, score, responsável e observações;
- tabela de leads com pesquisa, filtros, escolha de colunas e exportação CSV;
- agenda mensal, criação, edição, conclusão e exclusão de tarefas;
- notificações individuais, lembretes e marcação como lida;
- chat compartilhado com pesquisa, filtros, leitura, envio local e transferência de responsável;
- assinatura automática do novo atendente após transferência;
- relatórios por funil, origem, conversão e produtividade;
- administração de usuários, permissões, funis, etapas, etiquetas e campos personalizados;
- central de integrações com destino, mapeamento de campos e teste simulado;
- console white-label para criar empresas, duplicar configurações, alterar identidade e abrir cada ambiente;
- personalização de nome, logo, cor principal, cor secundária, fundo e módulos ativos.

As páginas não acessam os dados diretamente. Todas as operações passam por `CrmContext` e pelo contrato `CrmGateway`.

## Limites desta entrega

Esta versão está pronta para receber integrações, mas não inclui serviços externos ativos. Ainda dependem de backend e credenciais reais:

- autenticação permanente e recuperação de senha;
- banco PostgreSQL/Supabase;
- isolamento de dados por RLS no servidor;
- Meta Lead Ads, Google Ads e webhooks públicos;
- WhatsApp Cloud API e anexos reais;
- e-mails, filas, auditoria imutável, backups e monitoramento;
- notificações push fora do navegador.

O modo local é para avaliação funcional e visual, não para armazenar dados comerciais reais.

## Executar

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
npm run preview
```

Caso o Windows mantenha uma instalação anterior bloqueada, execute `corrigir-instalacao-windows.bat`.

## Trocar para backend real

Copie `.env.example` para `.env`:

```env
VITE_DATA_PROVIDER=rest
VITE_API_URL=https://api.seudominio.com.br/api
```

O `RestCrmGateway` já implementa os métodos utilizados pelas páginas. O backend deverá respeitar `docs/API-CONTRACT.md`.

## Estrutura

```text
src/
├── app/                 sessão, estado global e ações assíncronas
├── components/          componentes compartilhados, drawer e modais
├── core/                entidades, permissões, validações e utilidades
├── data/                base inicial do ambiente demonstrativo
├── infrastructure/      contrato, gateway local e gateway REST
└── pages/               módulos da interface
```

## Regra arquitetural

```text
Página → CrmContext → CrmGateway → LocalCrmGateway ou RestCrmGateway
```

Ao conectar Supabase, API própria ou outro backend, a substituição ocorre na infraestrutura. Kanban, leads, agenda, chat, relatórios e administração permanecem desacoplados.

## Documentação

- `ARQUITETURA-MVP.md`: arquitetura e limites da base.
- `docs/API-CONTRACT.md`: endpoints esperados pelo gateway REST.
- `docs/SUPABASE-SCHEMA.sql`: estrutura inicial PostgreSQL/Supabase.
- `docs/INTEGRATIONS.md`: Meta, Google, WhatsApp e webhooks.
- `docs/PRODUCTION-CHECKLIST.md`: itens obrigatórios antes da produção.
- `docs/REVISAO-E-VALIDACAO.md`: escopo auditado e testes executados.
