# Referências visuais LiDire

A interface deve seguir o material visual fornecido para o projeto:

- tema escuro;
- navy profundo;
- cartões arredondados;
- gradiente roxo → azul → ciano;
- tipografia Poppins + Inter;
- estética moderna, limpa e tecnológica;
- navegação mobile-first;
- logotipo oficial sem alterações.

O visual deve transmitir organização, clareza e assistência pessoal, sem substituir o conteúdo funcional por imagens.


## V4.5 — Regras preservadas
- O arquivo `logo-lidire-oficial.png` permanece inalterado.
- O modo claro usa a mesma identidade cromática da LiDire, apenas adaptada para fundos claros.
- Convites familiares usam o mesmo logotipo e os mesmos gradientes oficiais.
- Não criar uma nova marca, ícone ou paleta paralela.


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
- A página de convite familiar deve exibir o banner de convite em largura responsiva, sem miniatura.
- O banner deve manter a proporção 1200×630 e não pode substituir nem alterar o logo oficial.
- A página deve apresentar idioma consistente, sem mistura acidental de Português e English.



### v4.9 — convite ampliado e idioma consistente
- Aumenta a área visual do banner na página de convite, mantendo proporção 1200×630 e responsividade.
- O idioma do convite passa a acompanhar o idioma configurado por quem gera o convite, gravado no token de forma explícita.
- A página de compartilhamento `/convite` do Worker interpreta o idioma do token e entrega HTML, título, descrição e botão no idioma correspondente.
- Mantém a solução de compartilhamento social da v4.7/v4.8 e o logo oficial sem alterações.
