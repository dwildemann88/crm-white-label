# Revisão e validação da base v2

## Correções de design

- remoção dos estilos conflitantes entre temas claro e escuro;
- unificação de tipografia, espaçamentos, painéis, formulários e estados;
- correção da escala tipográfica: textos operacionais antes abaixo de 10 px foram elevados para níveis legíveis;
- aplicação real das cores da organização no fundo, sidebar e elementos primários;
- etiquetas com cores preservadas em Kanban, tabela, modal e detalhe;
- chat reorganizado no mobile, sem ocultar a lista de conversas;
- componentes sem ação removidos ou explicitamente desabilitados;
- fontes Inter e Poppins carregadas no documento.

## Correções funcionais

- entrada automática no administrador de demonstração, sem tela de login inicial;
- seletor interno para testar perfis no modo local;
- escopo de leitura e edição por função;
- múltiplos funis criáveis e selecionáveis;
- validação de etapas, usuários e integrações por funil;
- histórico tanto no arraste quanto na edição do lead;
- CRUD de leads, tarefas, usuários, funis, etapas, etiquetas e campos personalizados;
- filtros e exportação de leads;
- notificações e lembretes marcáveis como lidos;
- filtros, leitura, envio e transferência no chat local;
- duplicação white-label com referências reconstruídas;
- troca entre ambientes de empresa pelo console de desenvolvedor;
- bloqueios para operações incompatíveis ou sem permissão.

## Validações executadas

- verificação TypeScript sem erros;
- build Vite de produção;
- instalação limpa pelo `package-lock.json` com registro público do npm;
- teste profundo do gateway local cobrindo perfis, escopos, CRUD, deduplicação, histórico, tarefas, notificações, chat, campos, etiquetas, multiempresa e múltiplos funis;
- busca por referências ao repositório npm interno e arquivos temporários.

## Limites da validação

O ambiente de execução não permitiu uma inspeção automatizada confiável por navegador headless. A revisão visual foi feita por estrutura de componentes, CSS, responsividade declarada e build. Antes de produção, ainda é necessária validação manual em navegadores e aparelhos reais.

As integrações externas permanecem simuladas. Nenhum teste desta base comprova comunicação real com Meta, Google, WhatsApp, Supabase ou serviços de e-mail.
