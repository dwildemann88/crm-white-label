# Arquitetura da base de produto

Esta versão separa interface, regras de negócio e persistência. O objetivo é permitir que o ambiente demonstrativo seja substituído por um backend real sem reescrever as páginas.

## Fluxo principal

```text
Página
  ↓
CrmContext
  ↓
CrmGateway
  ├── LocalCrmGateway: avaliação funcional persistida no navegador
  └── RestCrmGateway: API e banco reais
```

## Camadas

- `core`: tipos, permissões, normalização, formatação e regras compartilhadas.
- `data`: dados iniciais da demonstração.
- `infrastructure`: autenticação, persistência e chamadas HTTP.
- `app`: sessão, carregamento, erros e ações que atualizam o snapshot.
- `pages`: experiências de dashboard, Kanban, leads, calendário, chat, relatórios, integrações e administração.
- `components`: formulários, modais, etiquetas, drawer e estrutura visual.

## Identidade e acesso

No modo local, a sessão de demonstração é criada automaticamente para o administrador. O seletor interno de perfis permite testar as restrições de gerente, comercial e SDR.

No modo REST, o seletor é removido e o sistema passa a depender de uma sessão retornada pelo backend. A futura autenticação séria pode utilizar Supabase Auth ou uma API própria sem alterar os módulos funcionais.

## Multiempresa e white-label

Todas as entidades principais possuem `organizationId`. Cada empresa possui:

- identidade visual;
- módulos ativos;
- usuários;
- funis e etapas;
- etiquetas e campos personalizados;
- integrações;
- leads, tarefas e conversas.

A separação local demonstra o comportamento. Em produção, o isolamento precisa ser garantido pelo banco e pelo backend, preferencialmente com Row Level Security.

## Permissões

O frontend oculta ou desabilita ações incompatíveis, mas o gateway local também valida operações. O backend real deverá repetir e endurecer essas regras. A interface nunca deve ser a única barreira de segurança.

## Limite consciente

O modo local simula persistência, sessão, mensagens e testes de integração. Ele não substitui:

- banco transacional;
- autenticação segura;
- webhooks públicos;
- filas e idempotência;
- WhatsApp Cloud API;
- criptografia de credenciais;
- auditoria imutável;
- backups e monitoramento.
