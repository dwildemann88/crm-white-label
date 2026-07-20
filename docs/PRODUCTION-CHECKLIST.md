# Checklist de produção

## Backend e banco

- aplicar `SUPABASE-SCHEMA.sql` ou schema equivalente;
- implementar o contrato de `API-CONTRACT.md`;
- substituir `VITE_DATA_PROVIDER=local` por `rest`;
- aplicar migrações versionadas;
- configurar transações, índices, backup e restauração;
- separar homologação e produção.

## Autenticação e segurança

- login permanente, recuperação de senha e convite de usuário;
- cookie seguro `httpOnly` ou sessão equivalente;
- 2FA para administradores, quando viável;
- RLS e validação de `organization_id` em todas as consultas;
- validação de função, equipe, funil, responsável e compartilhamento;
- criptografia das credenciais de integrações;
- rate limit, proteção de login e revogação de sessões;
- verificação de assinatura dos webhooks;
- auditoria de edições, exportações, transferências e acesso entre empresas.

## Dados e operação comercial

- normalização de telefone e e-mail;
- deduplicação e idempotência;
- histórico imutável de etapas e responsáveis;
- paginação, ordenação e filtros no servidor;
- tratamento de concorrência entre edições;
- política LGPD, exportação e exclusão de dados;
- importação inicial com validação e relatório de falhas.

## Mensagens

- WhatsApp Cloud API configurada;
- webhook de mensagens e status;
- fila de envio e reprocessamento;
- armazenamento seguro de anexos;
- janela de atendimento e templates;
- trava contra respostas simultâneas;
- observabilidade de falhas e desconexões.

## Qualidade

- testes unitários das regras de permissão e deduplicação;
- testes de integração dos endpoints;
- testes end-to-end dos fluxos críticos;
- revisão responsiva em navegadores e aparelhos reais;
- acessibilidade de teclado, foco e contraste;
- monitoramento de erros e desempenho.

## Publicação

- domínio e HTTPS;
- variáveis secretas fora do repositório;
- política de privacidade e termos;
- logs estruturados;
- alertas de webhook/integrador desconectado;
- plano de contingência e restauração validado.
