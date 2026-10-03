# Prompt de desenvolvimento — LiDire MVP 1.0

Desenvolver o MVP 1.0 do aplicativo LiDire — “Seu Copiloto para a Vida”.

## Identidade visual obrigatória

- Manter interface escura.
- Fundo principal: #070C22.
- Fundo secundário: #0B1230.
- Cards: #101A3B e #141F47.
- Texto: #F7F8FF.
- Texto secundário: #A9B0CA.
- Gradiente principal: #7B2CFF → #2E75FF → #12D9D2.
- Acento rosa: #E91E9B.
- Fontes: Poppins para títulos e Inter para textos.
- Usar exclusivamente o arquivo `logo-lidire-oficial.png` fornecido. Não redesenhar, substituir ou alterar o logotipo.

## Módulos

Home / Meu Dia, autenticação, perfil, Agenda, Tarefas, Lembretes, Compras, Hidratação, Estudos, Treinos, Finanças, Objetivos, Resumo diário/semanal, Assistente LiDire e Família.

## Regras funcionais

Nenhum botão deve ser meramente decorativo. Cada ação deve abrir uma tela, formulário, confirmação ou executar uma função.

Agenda e tarefas são entidades diferentes.

Treinos devem suportar exercício, carga, meta de repetições e repetições executadas.

Finanças devem suportar receitas, despesas e despesas fixas.

Objetivos devem combinar meta, prazo, valor acumulado, tarefas relacionadas e progresso.

Família deve permitir compartilhamento futuro de compromissos, listas de compras, treinos, estudos e outras informações autorizadas.

## Arquitetura

A versão atual usa armazenamento local para permitir testes imediatos.

A próxima etapa deve conectar Cloudflare Workers + D1, autenticação segura e isolamento dos dados por usuário.

Não usar dados estáticos como substituto das funcionalidades.

## Atualização 4.4 — Idioma e aparência
- Implementar troca funcional de toda a interface entre Português (Brasil) e English.
- Implementar somente duas aparências: Claro e Escuro; não oferecer modo Sistema.
- Persistir as preferências do usuário.
- A aparência clara deve preservar a paleta oficial da marca LiDire, com roxo/ciano como cores de destaque.


## Atualização 4.5 — Família e convite
- Manter integralmente a identidade visual e o logotipo oficial.
- Organizar permissões familiares em linhas com checkbox, ícone e nome do recurso.
- Criar prévia visual de convite familiar com o logotipo oficial.
- Separar convite familiar de link público de divulgação.
- Preparar compartilhamento por WhatsApp e cópia do link.
- O convite não deve conceder acesso aos dados por si só; a autorização real deve ocorrer no fluxo de conta/backend.


## Versão 4.6 — compartilhamento social robusto
- Prévia social processada pelo Cloudflare Worker na borda.
- Links `?convite=` usam título, descrição e banner específicos de convite familiar.
- Links públicos usam a prévia institucional.
- Rotas diretas para as imagens sociais com `Content-Type: image/png` e cache público controlado.
- Metadados Open Graph/Twitter usam URLs absolutas do domínio atual.
- Arquivo `logo-lidire-oficial.png` permanece inalterado.


### v4.7
Compartilhamento social deve usar páginas dedicadas `/convite?token=...` e `/divulgacao`, mantendo os banners oficiais e evitando depender do HTML da SPA para os metadados OG.

### v4.8
- Exibir `lidire-invite-preview.png` em tamanho grande e responsivo na página `/convite`.
- Manter proporção 1200×630 e identidade visual oficial.
- Garantir que a interface do convite use um único idioma por vez, sem trechos parcialmente traduzidos.



### v5.2 — convite ampliado e idioma consistente
- Aumenta a área visual do banner na página de convite, mantendo proporção 1200×630 e responsividade.
- O idioma do convite passa a acompanhar o idioma configurado por quem gera o convite, gravado no token de forma explícita.
- A página de compartilhamento `/convite` do Worker interpreta o idioma do token e entrega HTML, título, descrição e botão no idioma correspondente.
- Mantém a solução de compartilhamento social da v4.7/v4.8 e o logo oficial sem alterações.
