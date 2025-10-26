# 🚀 Scripts de Deploy Automatizado - App Platform

Este documento explica como usar os scripts automatizados para fazer deploy do Arqrender no DigitalOcean App Platform.

---

## 📦 Arquivos

### 1. `.do/app.yaml`
Especificação do app para o App Platform (App Spec). Define:
- Nome do app
- Região
- Configuração do serviço web
- Comandos de build e run
- Variáveis de ambiente
- Banco de dados

### 2. `scripts/deploy-app-platform.sh`
Script Bash automatizado para:
- Criar app no App Platform
- Atualizar app existente
- Fazer deploy/redeploy
- Gerenciar variáveis de ambiente
- Ver logs
- Deletar app

---

## 🛠️ Pré-requisitos

### 1. Instalar doctl (CLI da DigitalOcean)

**macOS:**
```bash
brew install doctl
```

**Linux:**
```bash
# Ubuntu/Debian
snap install doctl

# Ou via script
cd ~
wget https://github.com/digitalocean/doctl/releases/download/v1.98.1/doctl-1.98.1-linux-amd64.tar.gz
tar xf doctl-1.98.1-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin
```

**Windows:**
```powershell
scoop install doctl
```

### 2. Autenticar doctl

1. Crie um Personal Access Token no DigitalOcean:
   - Acesse: https://cloud.digitalocean.com/account/api/tokens
   - Clique em **Generate New Token**
   - Nome: `doctl-arqrender`
   - Scopes: Marque **Read** e **Write**
   - Clique em **Generate Token**
   - **Copie o token** (aparece uma única vez!)

2. Autentique o doctl:
```bash
doctl auth init
```

3. Cole o token quando solicitado

4. Verifique a autenticação:
```bash
doctl account get
```

### 3. Criar arquivo .env.production

Crie o arquivo `.env.production` na raiz do projeto com todas as variáveis de ambiente:

```bash
# Copiar template
cp .env.example .env.production

# Editar com suas credenciais reais
nano .env.production  # ou use seu editor preferido
```

**⚠️ IMPORTANTE**: Adicione `.env.production` ao `.gitignore` para não commitar credenciais!

```bash
echo ".env.production" >> .gitignore
```

---

## 📋 Uso do Script

### Comandos Disponíveis

```bash
# Mostrar ajuda
./scripts/deploy-app-platform.sh help

# Criar app pela primeira vez
./scripts/deploy-app-platform.sh create

# Atualizar app existente (após mudanças no código)
./scripts/deploy-app-platform.sh update

# Fazer deploy/redeploy (alias para update)
./scripts/deploy-app-platform.sh deploy

# Mostrar instruções para atualizar variáveis de ambiente
./scripts/deploy-app-platform.sh env

# Abrir logs do app no navegador
./scripts/deploy-app-platform.sh logs

# Mostrar informações do app (URL, status)
./scripts/deploy-app-platform.sh info

# Deletar app (cuidado!)
./scripts/deploy-app-platform.sh delete
```

---

## 🎯 Fluxo de Trabalho

### 1️⃣ Deploy Inicial (Primeira Vez)

```bash
# 1. Clonar repositório
git clone https://github.com/seu-usuario/arqrender.git
cd arqrender

# 2. Criar e preencher .env.production
cp .env.example .env.production
nano .env.production  # Preencha com suas credenciais

# 3. Revisar app.yaml (opcional)
nano .do/app.yaml  # Ajuste região, instance size, etc.

# 4. Criar app no App Platform
./scripts/deploy-app-platform.sh create

# 5. Aguardar deploy (5-10 minutos)
# O script mostrará a URL do app quando concluir

# 6. Configurar variáveis de ambiente manualmente
# Acesse: https://cloud.digitalocean.com/apps
# Vá para Settings → App-Level Environment Variables
# Adicione as variáveis do .env.production
# Clique em Save e faça redeploy
```

### 2️⃣ Deploy de Atualizações

Após fazer mudanças no código:

```bash
# 1. Commitar mudanças
git add .
git commit -m "feat: adicionar nova funcionalidade"
git push origin main

# 2. Fazer redeploy (se autodeploy estiver desativado)
./scripts/deploy-app-platform.sh deploy

# 3. Aguardar deploy (3-5 minutos)
```

### 3️⃣ Atualizar Variáveis de Ambiente

```bash
# 1. Editar .env.production
nano .env.production

# 2. Ver instruções para atualizar
./scripts/deploy-app-platform.sh env

# 3. Atualizar manualmente no App Platform
# (Por limitação do doctl, não é possível atualizar via CLI)
```

### 4️⃣ Monitorar Logs

```bash
# Abrir logs no navegador
./scripts/deploy-app-platform.sh logs

# Ou via doctl diretamente
doctl apps logs <APP_ID> --type run
```

### 5️⃣ Verificar Status

```bash
# Mostrar URL e informações do app
./scripts/deploy-app-platform.sh info

# Ou via doctl diretamente
doctl apps list
doctl apps get <APP_ID>
```

---

## 🔧 Personalização do app.yaml

### Alterar Região

```yaml
region: nyc  # New York (padrão)
# Outras opções:
# - sfo: San Francisco
# - ams: Amsterdam
# - sgp: Singapore
# - fra: Frankfurt
```

### Alterar Tamanho da Instância

```yaml
instance_size_slug: basic-xxs  # $12/mês (512 MB RAM)
# Outras opções:
# - basic-xs: $24/mês (1 GB RAM)
# - basic-s: $48/mês (2 GB RAM)
# - professional-xs: $48/mês (1 GB RAM, mais CPU)
```

### Alterar Número de Instâncias

```yaml
instance_count: 1  # Padrão
# Para escalar horizontalmente:
instance_count: 2  # 2 containers (dobra o custo)
```

### Configurar Autodeploy

```yaml
github:
  deploy_on_push: true  # Deploy automático a cada push
  # Ou:
  deploy_on_push: false  # Deploy manual apenas
```

### Adicionar Domínio Customizado

```yaml
domains:
  - domain: arqrender.com
    type: PRIMARY
  - domain: www.arqrender.com
    type: ALIAS
```

---

## 🐛 Troubleshooting

### Erro: "doctl: command not found"

**Solução**: Instale o doctl (veja seção Pré-requisitos)

### Erro: "doctl not authenticated"

**Solução**: Execute `doctl auth init` e forneça seu Personal Access Token

### Erro: "App 'arqrender' already exists"

**Solução**: Use `./scripts/deploy-app-platform.sh update` em vez de `create`

### Erro: "Build failed"

**Causas comuns**:
1. Dependências faltando no `package.json`
2. Erro de sintaxe no código
3. Variáveis de ambiente faltando

**Solução**:
```bash
# Ver logs de build
./scripts/deploy-app-platform.sh logs

# Testar build localmente
pnpm install
pnpm build
```

### Erro: "Database connection refused"

**Causas comuns**:
1. Trusted Sources não configurado
2. DATABASE_URL incorreta

**Solução**:
1. Acesse o Database no painel da DigitalOcean
2. Vá para Settings → Trusted Sources
3. Adicione "All App Platform apps"
4. Verifique se a variável `DATABASE_URL` está correta

### Deploy muito lento

**Causas comuns**:
1. Muitas dependências
2. Build pesado
3. Região distante

**Soluções**:
- Use cache de build (já configurado no app.yaml)
- Otimize dependências (remova não usadas)
- Escolha região mais próxima

---

## 📊 Comparação: Script vs Manual

| Aspecto | Manual (UI) | Script Automatizado |
|---------|-------------|---------------------|
| **Tempo de setup** | 15-20 min | 2-3 min |
| **Deploy inicial** | 10 cliques | 1 comando |
| **Atualizações** | 5 cliques | 1 comando |
| **Reprodutibilidade** | Baixa | Alta |
| **Versionamento** | Não | Sim (app.yaml no Git) |
| **CI/CD** | Difícil | Fácil |
| **Curva de aprendizado** | Baixa | Média |

---

## 🔄 Integração com CI/CD

### GitHub Actions

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to App Platform

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install doctl
        uses: digitalocean/action-doctl@v2
        with:
          token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}
      
      - name: Deploy to App Platform
        run: |
          doctl apps list
          APP_ID=$(doctl apps list --format ID,Name | grep "arqrender" | awk '{print $1}')
          doctl apps update $APP_ID --spec .do/app.yaml
```

**Configurar Secret**:
1. GitHub → Settings → Secrets and variables → Actions
2. Clique em **New repository secret**
3. Name: `DIGITALOCEAN_ACCESS_TOKEN`
4. Value: Seu Personal Access Token
5. Clique em **Add secret**

### GitLab CI

Crie `.gitlab-ci.yml`:

```yaml
deploy:
  stage: deploy
  image: digitalocean/doctl:latest
  script:
    - doctl auth init --access-token $DIGITALOCEAN_ACCESS_TOKEN
    - APP_ID=$(doctl apps list --format ID,Name | grep "arqrender" | awk '{print $1}')
    - doctl apps update $APP_ID --spec .do/app.yaml
  only:
    - main
```

---

## 📚 Recursos Adicionais

### Documentação Oficial
- **App Platform**: https://docs.digitalocean.com/products/app-platform/
- **doctl**: https://docs.digitalocean.com/reference/doctl/
- **App Spec**: https://docs.digitalocean.com/products/app-platform/reference/app-spec/

### Tutoriais
- **Quickstart**: https://docs.digitalocean.com/products/app-platform/getting-started/quickstart/
- **Deploy from GitHub**: https://docs.digitalocean.com/products/app-platform/how-to/deploy-from-github/
- **Manage Databases**: https://docs.digitalocean.com/products/app-platform/how-to/manage-databases/

### Comunidade
- **DigitalOcean Community**: https://www.digitalocean.com/community
- **Stack Overflow**: https://stackoverflow.com/questions/tagged/digitalocean

---

## 🎉 Conclusão

Com esses scripts, o deploy do Arqrender no App Platform fica:
- ✅ **Automatizado**: 1 comando para deploy
- ✅ **Reproduzível**: app.yaml versionado no Git
- ✅ **Rápido**: 3-5 minutos por deploy
- ✅ **Confiável**: Menos erros humanos
- ✅ **Escalável**: Fácil integrar com CI/CD

**Próximos passos**:
1. Teste o script em ambiente de desenvolvimento
2. Configure CI/CD (opcional)
3. Documente processo específico da sua equipe
4. Configure monitoramento e alertas

---

**Última atualização**: 26 de outubro de 2025
**Versão**: 1.0
**Autor**: Equipe Arqrender

