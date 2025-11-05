# Fanmon Pokédex

Aplicação Next.js para administrar e consultar uma Pokédex personalizada. Inclui backend com Prisma/SQLite, autenticação via NextAuth e painel administrativo para CRUD de gerações, tipos e Pokémon.

## Destaques
- Painel administrativo protegido (roles ADMIN/EDITOR).
- CRUD para gerações, tipos (relacionamentos: forte, fraco, imune) e Pokémon.
- Upload local de imagem/áudio (armazenados em `public/uploads`).
- Validação com Zod e ORM Prisma (SQLite).

## Pré-requisitos
- Node.js 20+
- Banco SQLite (arquivo) acessível no projeto
- Variáveis de ambiente configuradas (veja `docs/environment.md`)

## Instalação (desenvolvimento)
1. Clone o repositório:
   ```bash
   git clone https://github.com/icidade/fanmon-pokedex.git
   cd fanmon-pokedex
   ```
2. Instale dependências:
   ```bash
   npm install
   ```
3. Crie `.env.local` seguindo `docs/environment.md`. Um exemplo de `DATABASE_URL` para SQLite:
   ```env
   DATABASE_URL="file:./dev.db"
   ```
4. Execute migrações:
   ```bash
   npx prisma migrate deploy
   ```
   (ou `npx prisma migrate dev` em ambiente local para gerar migrações)
5. Inicie em modo de desenvolvimento:
   ```bash
   npm run dev
   ```
   A aplicação ficará disponível em http://localhost:3000

## Scripts úteis
- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run start` — inicia a build em produção
- `npm run lint` — executa ESLint
- `npx prisma studio` — inspecionar dados localmente

## Painel administrativo
- URL: `/dashboard`
- A tela de login está em `/login` (provider de credenciais do NextAuth).
- Permissões: usuários com papel `ADMIN` ou `EDITOR` podem acessar o painel.
- Funcionalidades:
  - CRUD de gerações.
  - CRUD de tipos com gerenciamento de relações (forte, fraco, imune).
  - CRUD de Pokémon: campos principais, estatísticas base e upload local de imagem/áudio.

## Estrutura do projeto
- `src/app/api` — rotas REST autenticadas (gerações, tipos, Pokémon e autenticação).
- `src/app/dashboard` — páginas do painel administrativo.
- `src/lib` — Prisma Client, autenticação, validações Zod e utilitários.
- `src/components` — formulários e componentes reutilizáveis.
- `prisma/schema.prisma` — definição do banco de dados.

## Variáveis de ambiente
Consulte `docs/environment.md` para a lista completa. As principais:
- DATABASE_URL — conexão (ex.: `file:./dev.db` para SQLite)
- NEXTAUTH_URL — URL da aplicação (ex.: http://localhost:3000)
- NEXTAUTH_SECRET — segredo do NextAuth
- (outros conforme `docs/environment.md`)

## Banco de dados e seed
- Migrações: `npx prisma migrate deploy`
- Para popular dados de teste (se houver script de seed): execute o script de seed documentado no projeto ou use `npx prisma db seed` se configurado.

## Contribuição
1. Abra uma issue descrevendo a proposta ou bug.
2. Faça um fork e crie uma branch com o prefixo `feature/` ou `fix/`.
3. Faça commits claros e um PR para `main`.
4. Respeite as regras de lint e formato do projeto.

## Licença
MIT
## Contato
Para dúvidas ou integração: icidade (no GitHub) — https://github.com/icidade
