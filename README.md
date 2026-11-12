# Lista GO - Quem Leva o Quê?

Sistema de gestão de listas compartilhadas desenvolvido com **Quasar Framework (Vue 3 + Vite + Pinia)** e **NestJS 11 (TypeORM + SQLite)**.

## Características Principais

- **Autenticação**: Login e Registro de conta com JWT.
- **Quem Leva o Quê?**: Criação dinâmica de listas com compartilhamento por link e QR Code.
- **Colaboração Pública Sem Login**: Quem recebe o link de compartilhamento pode acessar diretamente, informar seu nome, adicionar itens ("Eu trago..." ou "Precisamos de...") e assumir itens pendentes marcados com `?`.
- **Interface Moderna**: Estilizada com base nos mockups (anexos), com layout responsivo em colunas, cards arredondados e botões com identidade visual limpa.

## Como Executar

### 1. Instalar as dependências

Na raiz do projeto:
```bash
npm install
npm run install:server
```

### 2. Rodar em Modo de Desenvolvimento (Frontend + Backend juntos)

```bash
npm run dev
```

- O backend NestJS rodará na porta `3000` (http://localhost:3000/api e documentação Swagger em http://localhost:3000/docs).
- O frontend Quasar rodará na porta `9000` (http://localhost:9000).

### Usuário Padrão Inicial
- **Login**: `admin`
- **Senha**: `admin123`

