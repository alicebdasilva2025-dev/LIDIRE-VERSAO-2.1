# LiDire MVP 2.1

## Objetivo
Correção do cadastro de membros da família para usar a estrutura D1 real já existente, preservando o login funcional da 2.0.

## D1
Nenhuma alteração manual obrigatória. A tabela `family_members` já possui `photo TEXT DEFAULT ''` e `group_id`. A aplicação garante a existência do grupo do usuário e grava o membro no grupo correto.

## Foto do membro
A foto é selecionada no formulário, comprimida no navegador para JPEG e enviada ao Worker. O Worker valida o Data URL e limita o tamanho para evitar payloads excessivos.

## Persistência
Ao iniciar uma sessão autenticada, a LiDire consulta `/api/family` e reconstrói a lista visual a partir do D1. Após adicionar/editar/excluir um membro, a lista é recarregada do banco.

## Autenticação
A lógica de sessão/cookie + Bearer da versão 2.0 funcional foi preservada. Não há alteração de login nesta versão.

## Deploy
`wrangler.toml` mantém `name = "director"` e o mesmo binding D1 `DB`.
