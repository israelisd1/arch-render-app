# Architecture Rendering App

Aplicação web para renderização de imagens arquitetônicas 2D em alta qualidade usando Inteligência Artificial.

## Funcionalidades

- **Upload de Imagens**: Faça upload de desenhos arquitetônicos 2D (plantas, fachadas, interiores)
- **Renderização IA**: Transforme suas imagens em renderizações fotorrealísticas
- **Configurações Personalizadas**:
  - Tipo de cena: Interior ou Exterior
  - Formato de saída: JPG, PNG, WebP, AVIF
  - Prompt opcional para guiar o estilo da renderização
- **Histórico**: Acompanhe todas as suas renderizações com atualização em tempo real
- **Download**: Baixe as imagens renderizadas em alta qualidade

## Tecnologias Utilizadas

### Backend
- **Node.js** com Express
- **tRPC** para comunicação type-safe entre frontend e backend
- **Drizzle ORM** para gerenciamento do banco de dados MySQL
- **S3** para armazenamento de imagens
- **RapidAPI** - Architecture Rendering API (MyArchitectAI)

### Frontend
- **React 19** com TypeScript
- **Tailwind CSS 4** para estilização
- **shadcn/ui** para componentes de interface
- **Wouter** para roteamento
- **TanStack Query** (via tRPC) para gerenciamento de estado

## Estrutura do Banco de Dados

### Tabela `users`
- Gerenciamento de usuários com autenticação OAuth
- Campos: id, openId, name, email, role, timestamps

### Tabela `renders`
- Histórico de renderizações
- Campos:
  - `id`: ID único
  - `userId`: Referência ao usuário
  - `originalImageUrl`: URL da imagem original no S3
  - `renderedImageUrl`: URL da imagem renderizada
  - `sceneType`: "interior" ou "exterior"
  - `outputFormat`: "jpg", "png", "webp", "avif"
  - `prompt`: Descrição opcional para guiar a renderização
  - `status`: "pending", "processing", "completed", "failed"
  - `errorMessage`: Mensagem de erro (se houver)
  - `createdAt`, `completedAt`: Timestamps

## Fluxo de Renderização

1. **Upload**: Usuário faz upload da imagem 2D
2. **Armazenamento**: Imagem é salva no S3
3. **Registro**: Criação de registro no banco com status "processing"
4. **API Call**: Chamada assíncrona para a API RapidAPI
5. **Processamento**: API processa a imagem (10-30 segundos)
6. **Atualização**: Status atualizado para "completed" ou "failed"
7. **Visualização**: Usuário vê resultado no histórico

## API Integration

A aplicação utiliza o endpoint `/render` da Architecture Rendering API:

```typescript
POST https://architecture-rendering-api.p.rapidapi.com/render

Headers:
- Content-Type: application/json
- x-rapidapi-host: architecture-rendering-api.p.rapidapi.com
- x-rapidapi-key: [SUA_CHAVE]

Body:
{
  "sceneType": "interior" | "exterior",
  "outputFormat": "jpg" | "png" | "webp" | "avif",
  "image": "URL_DA_IMAGEM",
  "prompt": "descrição opcional"
}
```

## Variáveis de Ambiente

As seguintes variáveis são configuradas automaticamente:
- `RAPIDAPI_KEY`: Chave de autenticação da API RapidAPI
- `DATABASE_URL`: String de conexão MySQL
- `JWT_SECRET`: Segredo para assinatura de tokens
- Variáveis OAuth e S3 (gerenciadas pelo sistema)

## Desenvolvimento

```bash
# Instalar dependências
pnpm install

# Aplicar migrações do banco
pnpm db:push

# Iniciar servidor de desenvolvimento
pnpm dev
```

## Páginas da Aplicação

### Home (`/`)
- Landing page com apresentação da aplicação
- Botão de login/cadastro
- Acesso rápido para renderização (usuários autenticados)

### Renderização (`/render`)
- Formulário de upload de imagem
- Seleção de tipo de cena e formato
- Campo de prompt opcional
- Requer autenticação

### Histórico (`/history`)
- Lista de todas as renderizações do usuário
- Status em tempo real (atualização a cada 5 segundos)
- Download de imagens concluídas
- Requer autenticação

## Boas Práticas de Uso

### Imagens de Entrada
- **Formatos suportados**: JPG, PNG, WebP, AVIF
- **Tamanho máximo**: 10MB
- **Evitar**: Texto, anotações, linhas de dimensão
- **Ideal**: Desenhos limpos, plantas baixas, fachadas, perspectivas

### Prompts Efetivos
- Estrutura: `{sujeito}, {detalhes da cena}, {configuração}`
- ✅ Bom: "modern living room, beige tones, large windows, sunset lighting"
- ❌ Evitar: "generate a living room with sunset"
- Palavras no início têm mais peso
- Seja específico mas conciso

## Segurança

- Autenticação via OAuth (Manus)
- Chaves de API armazenadas como variáveis de ambiente
- Isolamento de dados por usuário
- URLs S3 públicas mas não enumeráveis (sufixos aleatórios)

## Performance

- Renderização padrão: ~10-15 segundos
- Upload e armazenamento: instantâneo
- Histórico com polling: atualização a cada 5 segundos
- Imagens otimizadas para web

## Suporte

Para dúvidas ou problemas:
1. Verifique os logs do servidor
2. Confirme que a chave RAPIDAPI_KEY está configurada
3. Verifique o status da API no RapidAPI Dashboard
4. Consulte a documentação da API: https://rapidapi.com/myarchitectai-team-myarchitectai-team-default/api/architecture-rendering-api

