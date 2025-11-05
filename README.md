## Fanmon Pokédex

Aplicação Next.js para administrar e consultar uma Pokédex personalizada. Inclui backend com Prisma/PostgreSQL, autenticação via NextAuth e painel administrativo para CRUD completo de gerações, tipos e Pokémon.

## Pré-requisitos

- Node.js 20+
- Banco PostgreSQL acessível
- Variáveis de ambiente configuradas (`docs/environment.md`)

## Setup

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo `.env.local` seguindo o guia em `docs/environment.md`.

3. Gere as tabelas do banco (usa o SQL do diretório `prisma/migrations`):

   ```bash
   npx prisma migrate deploy
   ```

4. Execute o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   A aplicação ficará disponível em [http://localhost:3000](http://localhost:3000).

## Painel administrativo

- URL: `/dashboard`
- Protegido por login (usuário com papel `ADMIN` ou `EDITOR`).
- Funcionalidades:
  - CRUD de gerações.
  - CRUD de tipos com gerenciamento de relacionamentos (forte, fraco, imune).
  - CRUD de Pokémon com campos principais, estatísticas base e upload local de imagem/áudio principal (arquivos armazenados em `public/uploads`).

A tela de login está em `/login` e utiliza o provider de credenciais do NextAuth.

## Scripts úteis

- `npm run dev`: servidor de desenvolvimento.
- `npm run build`: build de produção.
- `npm run start`: inicia a build.
- `npm run lint`: executa o ESLint.

## Estrutura

- `src/app/api`: rotas REST autenticadas para gerações, tipos, Pokémon e autenticação.
- `src/app/dashboard`: painel administrativo protegido e suas páginas.
- `src/lib`: Prisma Client, utilitários de autenticação, validações com Zod.
- `src/components`: formulários e componentes reutilizáveis do painel.
- `prisma/schema.prisma`: definição do banco de dados.

Consulte `docs/environment.md` para entender todas as variáveis de ambiente necessárias.
