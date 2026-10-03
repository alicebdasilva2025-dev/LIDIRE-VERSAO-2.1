# LiDire MVP 2.1 — IA com ações por módulo, D1 e internet em tempo real

Esta versão 1.8 inclui:
- IA identifica o módulo correto antes de registrar: Estudos, Compras, Treinos, Agenda, Hidratação, Alimentação, Finanças e Objetivos.
- Registros feitos pela IA são gravados no módulo correspondente e o Assistente mostra um botão para visualizar o registro no módulo.
- Cadastro de familiar consulta o D1 antes de criar o registro, evitando duplicidade e identificando se o e-mail já possui uma conta LiDire.
- A Assistente pode consultar a internet em tempo real quando a opção “Consultar a internet em tempo real” estiver ativada, usando o Google Search Grounding do Gemini e exibindo as fontes retornadas.
- Tarefas e lembretes continuam exigindo confirmação explícita antes da gravação.
- O Worker mantém o nome `director` para permitir atualização do Worker existente em `director.workers.dev`; `1.8` é a versão do aplicativo.

# Histórico de versões anteriores — LiDire MVP

Atualização da versão 4.4 com suporte funcional a:
- idioma Português (Brasil) e English;
- aparência somente Claro ou Escuro;
- preferência persistida em localStorage;
- versão clara preservando a paleta oficial da LiDire (roxo/ciano);
- manutenção das demais funcionalidades da 4.4.

## Atualização 4.5 — Família, convite e acabamento visual

A versão 4.5 mantém a identidade visual oficial da LiDire e acrescenta:
- refinamento do modo claro, com contraste consistente em campos, cards, textos e navegação;
- permissões familiares reorganizadas em linhas com checkbox + ícone + nome do recurso;
- prévia visual do convite familiar usando exclusivamente `logo-lidire-oficial.png`;
- fluxo separado para convite familiar e link público de divulgação;
- tela de convite acessível por `?convite=TOKEN`, sem expor dados da pessoa que enviou;
- ações de copiar o convite e compartilhar pelo WhatsApp;
- metadados Open Graph para compartilhamento da LiDire;
- proteção para que a tradução da interface não altere valores digitados pelo usuário.

O convite desta versão é uma camada de interface/fluxo do protótipo. A concessão real de acesso e a associação do membro familiar ao D1 continuam dependendo da etapa de backend correspondente.


## Versão 4.6 — compartilhamento social robusto
- Prévia social processada pelo Cloudflare Worker na borda.
- Links `?convite=` usam título, descrição e banner específicos de convite familiar.
- Links públicos usam a prévia institucional.
- Rotas diretas para as imagens sociais com `Content-Type: image/png` e cache público controlado.
- Metadados Open Graph/Twitter usam URLs absolutas do domínio atual.
- Arquivo `logo-lidire-oficial.png` permanece inalterado.


## LiDire MVP 4.7 — compartilhamento social

A 4.7 separa as páginas de compartilhamento das telas da SPA.
- `/convite?token=...` é uma página HTML dedicada ao crawler, com `og:image` absoluto e banner de convite.
- `/divulgacao` é a página pública de compartilhamento institucional.
- As imagens PNG são servidas por rotas explícitas do Worker com `Content-Type: image/png`.
- O convite copiado pelo aplicativo usa `/convite?token=...` e o botão da página de compartilhamento leva para `/?convite=...`.
- O nome do Worker no `wrangler.toml` foi atualizado para `mvp-versao-4-7`.
## Histórico de versões anteriores — LiDire MVP — convite visual e idioma

A 4.8 corrige o fluxo visual da página de convite familiar:
- O banner `lidire-invite-preview.png` passa a aparecer em tamanho grande e responsivo dentro da página aberta pelo convidado.
- O banner mantém proporção 1200×630 e a identidade visual oficial.
- A página de convite usa textos completos e consistentes com o idioma selecionado, sem combinar trechos de Português e English na mesma interface.
- O `logo-lidire-oficial.png` continua preservado sem alteração.
- O compartilhamento social da 4.7 permanece separado e funcional.



### v5.2 — convite ampliado e idioma consistente
- Aumenta a área visual do banner na página de convite, mantendo proporção 1200×630 e responsividade.
- O idioma do convite passa a acompanhar o idioma configurado por quem gera o convite, gravado no token de forma explícita.
- A página de compartilhamento `/convite` do Worker interpreta o idioma do token e entrega HTML, título, descrição e botão no idioma correspondente.
- Mantém a solução de compartilhamento social da v4.7/v4.8 e o logo oficial sem alterações.


## IA LiDire — primeira integração real

A 5.2 agora inclui uma integração real do Assistente LiDire com o Gemini, mantendo a chave de API exclusivamente no Cloudflare Worker. O Assistente envia uma versão sanitizada do contexto da rotina do usuário (tarefas, agenda, compras, estudos, treinos, hidratação, alimentação, finanças, objetivos, família e lembretes) para produzir respostas personalizadas. Dados como senha, sessão, endereço, telefone, fotos e outros segredos não são enviados ao modelo. O contexto do ciclo menstrual só é incluído quando a opção de uso pela IA estiver habilitada nas preferências.

### Configuração do Gemini

1. Crie/obtenha sua chave do Gemini no Google AI Studio.
2. Na pasta do projeto, configure a chave como segredo do Worker:

```bash
wrangler secret put GEMINI_API_KEY
```

3. Faça o deploy:

```bash
wrangler deploy
```

O modelo padrão configurado no `wrangler.toml` é `gemini-3.5-flash-lite`, com fallback para `gemini-3.1-flash-lite` quando houver limite temporário, mas pode ser alterado pela variável `GEMINI_MODEL`. A chave **não deve** ser colocada no `app.js`, no HTML ou em qualquer arquivo público. O aplicativo também reduz o histórico/contexto enviado e usa saídas mais curtas para economizar cota.

### O que a IA já faz

- conversa por texto dentro do Assistente;
- recebe o contexto dos módulos da LiDire;
- mantém as últimas interações da conversa durante a sessão;
- responde em Português ou English conforme o idioma configurado;
- usa também o reconhecimento de voz existente: a fala vira texto e é enviada à IA;
- pode ler a resposta em voz alta usando a síntese de voz do navegador.

### Próxima evolução

A base está preparada para a próxima etapa: permitir que a IA proponha ações estruturadas (por exemplo, criar uma tarefa, montar uma lista de compras ou organizar um plano de estudos) antes de executar qualquer alteração nos dados do usuário.


## MVP 5.2 — Identidade sonora
A versão 5.2 inclui uma assinatura sonora curta da LiDire para lembretes ativos no aplicativo e QR Code para a página pública de instalação/divulgação.

### Correções de estabilidade e UX — 5.2
- Internacionalização revisada com tradução bidirecional de telas, modais, botões e estados secundários, evitando substituições de palavras que corrompam textos.
- Removidos dados demonstrativos de compromissos familiares conhecidos de versões anteriores.
- Integrações familiares iniciam desconectadas e recursos compartilhados iniciam desativados até ação do usuário.
- Plano exibido como gratuito enquanto não houver fluxo real de assinatura.
- Fluxo Família → Configurações separado do fluxo Adicionar membro.
- QR Code e link de instalação disponíveis dentro do fluxo de Família.
- Histórico do ciclo e ações principais do ciclo tornados funcionais.
- Tipografia geral ampliada e contraste adicional no tema claro.


## Correções da versão 1.3

- A IA agora usa saída JSON estruturada para separar resposta e ações.
- Tarefas e lembretes solicitados por linguagem natural podem ser registrados no estado local do aplicativo.
- A IA pode cadastrar/atualizar alimentos e converter calorias informadas para uma quantidade específica em kcal por 100 g/ml ou por unidade.
- Receitas solicitadas com ingredientes e preparo podem ser salvas na biblioteca de receitas.
- O assistente não deve mais responder que não consegue alterar dados quando uma ação suportada estiver disponível.
- Mantida a limpeza de Markdown para tela e voz.
- Adicionado timeout de 20 segundos para chamadas ao Gemini.
- Mantidos modelos Flash-Lite estáveis com fallback.


## LiDire 1.4 — novos recursos

- Cadastro de membros da família com relação, e-mail, endereço e permissões.
- Notificações LiDire entre contas de membros da família; o destinatário precisa ter uma conta LiDire identificada pelo e-mail.
- Ciclo menstrual com início/fim, fluxo, humor, dor, cólicas, acne, dor de cabeça, inchaço, sensibilidade nas mamas, náusea, energia e observações.
- A IA pede confirmação explícita antes de cadastrar tarefas ou lembretes.
- Consulta de clima/previsão pela internet usando Open-Meteo.
- Rotas e tempo estimado usando localização do dispositivo e endereços informados.

### Segredos necessários no Cloudflare

Além de `GEMINI_API_KEY`, configure o segredo `GOOGLE_MAPS_API_KEY` para habilitar o cálculo de rotas pelo Google Maps Routes API. Não coloque essa chave no código do navegador.

O navegador solicita permissão explícita para acessar a localização. A Geolocation API funciona em contexto seguro (HTTPS).


## LiDire 2.1
Sincronização do foco, notificações familiares na Home, CRUD de lembretes, checagem de e-mail D1, anotações e conversas IA no D1, exportação de dados, Pomodoro com som próprio/soneca e novos controles de integração.


## LiDire 2.1 — Web Push

A versão 1.8 adiciona notificações Push reais para lembretes e notificações familiares. O navegador registra um Service Worker, cria uma assinatura Web Push e o Worker a armazena no D1. Lembretes sincronizados com o servidor são verificados pelo Cron Trigger a cada minuto; notificações familiares podem ser enviadas imediatamente. A Push API requer Service Worker e permissão explícita do usuário.

### Configuração obrigatória no Cloudflare

Gere um par VAPID (por exemplo, com `npx web-push generate-vapid-keys`) e configure os secrets:

```bash
wrangler secret put VAPID_PUBLIC_KEY
wrangler secret put VAPID_PRIVATE_KEY
wrangler secret put VAPID_SUBJECT
```

Use `VAPID_SUBJECT` como um identificador de contato, por exemplo `mailto:seu-email@dominio.com`. **Nunca coloque a chave privada no código ou no ZIP.**

Depois faça o deploy normalmente com `wrangler deploy`. O `wrangler.toml` mantém o Worker `director` e cria um Cron Trigger de 1 minuto para os lembretes.


## Correção de autenticação
A versão corrigida valida `/api/me` imediatamente após login/cadastro, envia respostas de API com `Cache-Control: no-store` e usa credenciais explícitas no navegador para evitar sessão aparentemente criada sem persistência.


## LiDire 2.1 — correção do D1 e cadastro de família

Esta versão foi ajustada para trabalhar com o D1 de produção já existente, sem exigir alteração manual da tabela `family_members`. A coluna `photo` já existente é utilizada diretamente.

Principais correções:
- criação/verificação automática do `family_groups` do usuário;
- leitura dos membros diretamente do D1 ao abrir o aplicativo;
- cadastro e edição realmente persistidos no D1;
- foto do membro convertida e comprimida no navegador antes do envio;
- limite de tamanho da foto para evitar requisições excessivamente grandes;
- tratamento específico de erros de chave estrangeira e campos obrigatórios;
- exclusão de membro sincronizada com o D1;
- login/autenticação preservados da versão 2.0 funcional;
- nenhum `DROP TABLE` ou alteração estrutural obrigatória no D1.

### Estrutura D1 esperada
A versão 2.1 foi validada contra a estrutura real informada no console Cloudflare: `family_groups` possui `id`, `owner_user_id`, `name`, `created_at`; `family_members` possui `photo`, `group_id`, `user_id`, `name`, `relation`, `email`, `address`, `permissions_json`, `role`, `status`, `created_at` e `updated_at`, com `user_id` obrigatório e FK para `users(id)`.

### Foto
A foto é armazenada no campo `family_members.photo` como Data URL JPEG comprimida. O cliente reduz a maior dimensão para 720 px e tenta manter o payload abaixo de aproximadamente 180 mil caracteres.
