# Variáveis de ambiente

Crie um arquivo `.env.local` com as variáveis abaixo antes de iniciar o projeto. Ajuste os valores conforme sua infraestrutura.

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fanmon"
NEXTAUTH_SECRET="defina-um-segredo-seguro"
NEXTAUTH_URL="http://localhost:3000"

# Configurações opcionais da AWS (requeridas para uploads)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""

# Limite de tamanho para uploads (em MB)
UPLOAD_MAX_FILE_SIZE_MB=10
```

- `DATABASE_URL`: conexão PostgreSQL utilizada pelo Prisma.
- `NEXTAUTH_SECRET`: segredo usado pelo NextAuth para assinar tokens JWT.
- `NEXTAUTH_URL`: URL pública do app (ajuste em produção).
- `AWS_*`: credenciais e região para acesso ao S3; mantenha em branco se ainda não for usar uploads.
- `UPLOAD_MAX_FILE_SIZE_MB`: limite máximo de upload para validação no backend.
- Uploads locais são gravados em `public/uploads`. O diretório é criado automaticamente quando o primeiro arquivo for enviado, mas você pode criá-lo manualmente se preferir (e adicioná-lo ao `.gitignore` caso não queira versionar arquivos enviados).

> Recomendações
>
> - Gere o `NEXTAUTH_SECRET` com um valor aleatório seguro (por exemplo, `openssl rand -base64 32`).
> - Nunca commite arquivos `.env`; utilize `.env.example` ou este guia para documentar os valores necessários.


