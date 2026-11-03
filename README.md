# Centro de Benefícios

Portal interno da Canaã Telecom. Funcionários acompanham atendimentos, metas e pontos, resgatam
produtos e jogam; a supervisão gerencia funcionários, produtos, metas, lançamentos e resgates, e
também participa do ranking dos jogos.

O ambiente publicado é de uso interno: só funcionários com conta criada pela supervisão
conseguem entrar. Este guia explica como rodar o projeto **no seu computador** para estudar e
testar.

| Pasta | Tecnologia |
|---|---|
| `backend/` | API REST em ASP.NET Core (.NET 10), Entity Framework Core |
| `frontend/` | Angular 22 com TypeScript |
| Banco | PostgreSQL |

## Pré-requisitos

- [.NET SDK 10](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org) 22.22 ou mais recente (versão LTS)
- [Git](https://git-scm.com)
- Ferramenta de migrations do EF Core:

  ```bash
  dotnet tool install --global dotnet-ef
  ```

- Um PostgreSQL para testes (veja o passo 2)

## 1. Baixar o projeto

```bash
git clone https://github.com/LucasAndre001/Centro-Beneficios-CRUD.git
cd Centro-Beneficios-CRUD
```

## 2. Criar um banco de testes

Use sempre um banco **só seu**. Nunca aponte a execução local para o banco de produção.

**Opção A: Docker (recomendado)**

```bash
docker run --name centro-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:17
```

Connection string:

```
Host=localhost;Port=5432;Database=centro_beneficios;Username=postgres;Password=postgres
```

Para parar e voltar a usar depois: `docker stop centro-pg` e `docker start centro-pg`.

**Opção B: Neon**

Crie um projeto gratuito em [neon.com](https://neon.com), clique em **Connect**, desmarque o
*connection pooling* e copie os dados para este formato:

```
Host=SEU-HOST.neon.tech;Database=SEU-BANCO;Username=SEU-USUARIO;Password=SUA-SENHA;SSL Mode=Require
```

## 3. Configurar a API

Os segredos ficam no `user-secrets`, fora da pasta do projeto, e nunca vão para o Git.

```bash
cd backend
dotnet user-secrets set "ConnectionStrings:Default" "SUA_CONNECTION_STRING"
dotnet user-secrets set "Jwt:Key" "qualquer-texto-aleatorio-com-pelo-menos-32-caracteres"
dotnet user-secrets set "Seed:AdminEmail" "admin@teste.com"
dotnet user-secrets set "Seed:AdminPassword" "Admin123"
```

| Chave | Para que serve |
|---|---|
| `ConnectionStrings:Default` | banco criado no passo 2 |
| `Jwt:Key` | chave que assina os tokens de login (mínimo 32 caracteres) |
| `Seed:AdminEmail` e `Seed:AdminPassword` | administrador criado automaticamente ao iniciar a API, se o e-mail ainda não existir |

Confira com `dotnet user-secrets list`.

Para criar mais administradores, use a lista `Seed:Admins` (um índice por pessoa) e reinicie a API:

```bash
dotnet user-secrets set "Seed:Admins:0:Name" "Nome Sobrenome"
dotnet user-secrets set "Seed:Admins:0:Email" "nome@teste.com"
dotnet user-secrets set "Seed:Admins:0:Password" "SenhaDeTeste1"
```

Contas que já existem nunca são alteradas. Depois de criadas, as senhas podem ser removidas com
`dotnet user-secrets remove "Seed:Admins:0:Password"`.

## 4. Criar as tabelas e iniciar a API

Ainda na pasta `backend`:

```bash
dotnet ef database update -- --environment Development
dotnet run
```

O terminal deve mostrar `Now listening on: http://localhost:5219`.

- Saúde da API: http://localhost:5219/api/health → `{"status":"ok","database":"conectado"}`
- Documentação interativa: http://localhost:5219/scalar

Deixe esse terminal aberto.

## 5. Iniciar o front

Em **outro** terminal, na raiz do projeto:

```bash
cd frontend
npm install
npm start
```

Abra http://localhost:4200.

## 6. Primeiro acesso

1. Entre com o e-mail e a senha que você definiu em `Seed:AdminEmail` e `Seed:AdminPassword`.
2. Em **Funcionários**, crie um ou mais funcionários com saldo inicial.
3. Em **Produtos**, cadastre um produto, escolha a foto, ajuste o enquadramento e clique em
   **Postar**.
4. Na tela inicial, use **Lançar atendimentos**, **Dar pontos** e **Definir metas**.
5. Saia e entre com um funcionário para ver o painel, resgatar na loja e jogar Tetris.
6. Volte como administrador e confira o resgate em **Resgates** e a pontuação em **Jogos**.

## O que mudar para testar

| Situação | O que alterar |
|---|---|
| A API abriu em outra porta | `apiUrl` em `frontend/src/environments/environment.development.ts` |
| O front abriu em outra porta (ex.: 4300) | `Cors:AllowedOrigins` em `backend/appsettings.Development.json` |
| Trocar de banco | `dotnet user-secrets set "ConnectionStrings:Default" "..."` |
| Recriar o administrador | apague o banco de testes (ou o admin) e reinicie a API |
| Mais administradores | lista `Seed:Admins` no `user-secrets` (passo 3) |
| Mudar o tempo de login | `Jwt:ExpiresMinutes` em `backend/appsettings.json` (padrão: 480) |

`frontend/src/environments/environment.ts` só é usado no build de produção; não precisa mexer
nele para rodar localmente.

## Testes

**Front (testes automatizados do motor do Tetris):**

```bash
cd frontend
npm test -- --watch=false
```

**API (pelo Scalar):** faça login em `POST /api/auth/login`, copie o `token`, cole na opção
**Bearer** do Scalar e chame os outros endpoints. Alguns testes que valem a pena:

- Resgatar um produto sem saldo suficiente → `409`
- Funcionário chamando uma rota `/api/admin/...` → `403`
- Enviar uma pontuação impossível em `POST /api/games/tetris/scores` → `400`
- Débito em lote maior que o saldo de alguém → `409`, e o saldo de ninguém muda

**Consistência dos pontos:** no banco, o saldo de cada funcionário precisa ser igual à soma do
extrato:

```sql
SELECT u."Id", u."PointsBalance", COALESCE(SUM(t."Amount"), 0) AS soma_extrato
FROM "Users" u
LEFT JOIN "PointTransactions" t ON t."UserId" = u."Id"
WHERE u."Role" = 'Employee'
GROUP BY u."Id", u."PointsBalance";
```

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| Erro de **CORS** no console do navegador | porta do front fora de `Cors:AllowedOrigins`, ou a API não está rodando |
| "Não foi possível falar com o servidor" | API parada ou `apiUrl` com a porta errada |
| `Connection string 'Default' não configurada` | faltou o `user-secrets`, ou o comando foi rodado fora da pasta `backend` |
| `Jwt:Key não configurada` | faltou `dotnet user-secrets set "Jwt:Key" ...` |
| Fui deslogado sozinho | o token expirou ou a `Jwt:Key` mudou; entre de novo |
| `dotnet ef` não é reconhecido | feche e abra o terminal depois de instalar a ferramenta |
| `curl` com erro de parâmetro no PowerShell | use `curl.exe` |
| A porta 5219 já está em uso | outra execução da API ficou aberta; feche-a |

## Estrutura

```
backend/
├── Controllers/   rotas HTTP
├── Services/      regras de negócio
├── Entities/      tabelas do banco
├── Dtos/          dados que entram e saem da API
├── Data/          contexto do EF Core e criação do admin
└── Migrations/    histórico das tabelas

frontend/src/app/
├── api/           chamadas à API
├── core/          login, guards, interceptor, modelos e avisos
├── layout/        cabeçalho e barra lateral
├── shared/        modal, abas, ícones, barra de progresso
└── pages/         telas do funcionário e do administrador
```
