# Relatório do projeto Site Óton Rodrigo Imóveis

**Data:** 17 de julho de 2026  
**Projeto:** Site institucional e painel administrativo — Óton Rodrigo Corretor de Imóveis  
**Localização:** Tiros/MG · CRECI MGF - 50403

---

## Por onde a gente começou

A ideia do projeto nasceu da análise de um site concorrente da região (jucaimoveis.com). A proposta não era copiar o layout, e sim entender o que funcionava bem em sites imobiliários locais e montar algo próprio para o Óton, com a identidade visual que já existia no projeto: azul escuro, amarelo e tipografia séria.

O resultado é um site estático (HTML, CSS e JavaScript), hospedado no GitHub Pages, com um painel administrativo que grava os dados no navegador (IndexedDB). Ou seja: dá para cadastrar imóveis, fotos, biografia e configurações do site sem precisar de um servidor de banco de dados tradicional — tudo roda no cliente, e a publicação do site em si vai pelo GitHub.

---

## O site público

### Página inicial

A home foi montada para apresentar o corretor e facilitar a busca. Tem:

- Cabeçalho com logo, menu e botão de WhatsApp  
- Busca rápida (comprar / alugar)  
- Destaques de imóveis  
- Categorias por tipo  
- Seção para anunciar imóvel  
- Biografia do corretor (texto e foto editáveis pelo painel)  
- Caixa “Conheça nosso escritório”, com carrossel de fotos  
- Mapa do escritório com endereço e telefones  
- Rodapé com links e contatos  

### Listagem de imóveis

A página de imóveis tem filtros mais trabalhados: finalidade (venda, aluguel ou os dois), tipo, localização, faixa de preço e ordenação. Os cards mostram fotos, preço, bairro e dados de condomínio quando existirem. Ao clicar, abre uma galeria ampliada com navegação entre fotos e atalho para o WhatsApp.

### Mapa do escritório

Em vez de ficar só um bloco de telefone e endereço solto acima do mapa, a gente padronizou uma seção “Nosso escritório”: dados de contato + mapa embutido do Google. Isso aparece na home, na listagem e também na tela de login. Os links pequenos de “Ver no mapa / Street View” que ficavam duplicados na área de contato foram removidos para não repetir informação.

### Login

O acesso ficou simplificado: só administrador, por enquanto. Os logins de proprietário e inquilino foram retirados (as páginas de portal até foram descartadas do fluxo). O login usa e-mail e senha, com usuário de demonstração `admin@oton.com.br`.

---

## O painel administrativo

O painel (`admin.html`) é onde o Óton (ou quem ele autorizar) cuida do conteúdo do site. Depois de várias funcionalidades acumuladas na mesma tela, organizamos tudo em **abas**:

1. **Imóveis** — lista, cadastro, edição, exclusão e galeria de fotos  
2. **Biografia** — nome, título/CRECI, texto e foto do corretor na home  
3. **Escritório** — fotos do escritório, capa, texto e tempo do carrossel  
4. **Menu** — botões da navegação do site (texto e link de cada item)  

### Cadastro de imóveis

Cada imóvel pode ter:

- Título, código automático, finalidade (venda, aluguel ou ambos)  
- Tipo (casa, apartamento, terreno, chácara, rural, comercial)  
- Bairro, cidade, preço, área, quartos, suítes, banheiros, vagas  
- Nome e valor do condomínio  
- Descrição e opção de destacar na home  
- Galeria com várias fotos (a primeira vira capa; dá para reordenar)  
- **Status:** Disponível, Alugado ou Vendido  

O status foi o último ajuste importante: quando um imóvel é alugado ou vendido, basta marcar no painel. Ele some da home e da listagem pública, mas continua visível no admin para histórico e consulta.

### Biografia

A seção “Conheça o corretor” na home não é mais texto fixo no HTML. O admin edita nome, CRECI/título, biografia e foto. Isso atualiza direto na página inicial.

### Escritório na home

Foi criada a caixa “Conheça nosso escritório”. No painel dá para:

- Subir várias fotos  
- Definir qual é a capa (primeira do carrossel)  
- Ajustar o tempo em segundos entre uma foto e outra  
- Editar título e texto de apoio  

Na home, as fotos passam automaticamente, têm setas para o visitante avançar/voltar, e pausam quando o mouse fica em cima.

### Menu do site

Os botões do menu (Imóveis, Anuncie seu imóvel, Serviços, Sobre, Contato etc.) também são editáveis no painel: texto, link, ordem, inclusão e remoção. O botão “Entrar” permanece fixo no fim, porque é o acesso ao painel.

---

## Detalhes técnicos (sem enrolação)

- **Front:** HTML + CSS + JavaScript puro  
- **Dados locais:** IndexedDB (`store.js`), com compressão de imagens no navegador para não estourar o armazenamento  
- **Autenticação:** sessão no navegador, senha com hash (e fallback quando o ambiente não tem `crypto.subtle`)  
- **Publicação:** GitHub Pages via Actions (workflow em `.github/workflows/pages.yml`)  
- **Repositório:** push na branch `main` dispara o deploy  

Um ponto importante para quem for usar: como o painel grava no IndexedDB do **navegador**, os imóveis e fotos cadastrados ficam naquele computador/navegador. O site publicado no GitHub Pages entrega a estrutura e o código; os dados cadastrados localmente não “viajam” sozinhos para outros visitantes. Se no futuro quiser um cadastro compartilhado entre dispositivos, aí entra um backend de verdade (API + banco).

---

## Linha do tempo do que foi feito

1. Análise do site de referência e definição do Site Oton  
2. Site estático com identidade visual, listagem e painel básico  
3. Deploy no GitHub Pages (incluindo correção de enablement do Pages)  
4. Login com papéis (depois simplificado só para admin)  
5. Campos de condomínio no cadastro  
6. Filtros melhores + finalidade “venda e aluguel” + mapa do escritório  
7. Biografia editável com foto  
8. Menu editável pelo painel  
9. Limpeza da área de contato duplicada; mapa padronizado  
10. Seção do escritório com fotos e carrossel (setas + tempo em segundos)  
11. Painel organizado em abas  
12. Status do imóvel (disponível / alugado / vendido) para sumir do site público  

---

## Como usar no dia a dia

1. Abrir o site e entrar em **Entrar** (ou ir direto em `login.html`)  
2. Acessar com o admin  
3. Na aba **Imóveis**, cadastrar ou editar anúncios e fotos  
4. Quando fechar um negócio, mudar o **Status** para Alugado ou Vendido  
5. Na aba **Biografia**, atualizar texto e foto do corretor  
6. Na aba **Escritório**, manter as fotos do espaço e o tempo do carrossel  
7. Na aba **Menu**, ajustar os botões do topo se precisar  
8. Conferir o resultado na home e em Imóveis (vale um refresh forçado se o navegador cachear)  

---

## Em resumo

Montamos um site completo para o Óton Rodrigo Imóveis: vitrine pública, busca, galeria, mapa, biografia e uma área administrativa organizada. O foco foi deixar o dia a dia simples — cadastrar imóvel, subir foto, marcar como vendido/alugado e atualizar o que aparece na home — sem depender de uma ferramenta cara de white-label, mas com cara de site profissional de corretagem.

Se quiser evoluir depois, os caminhos naturais são: backend compartilhado, mais de um usuário no painel, e talvez um histórico público de “imóveis vendidos” (hoje eles só somem da vitrine).

---

*Documento gerado a partir do desenvolvimento do projeto SiteOton.*
