# 🌊 Guia Completo - Deploy na DigitalOcean

Guia passo a passo para instalar a **Arqrender** na DigitalOcean.

## 💰 Custos Mensais

| Item | Custo | Detalhes |
|------|-------|----------|
| **Droplet Basic** | $12/mês (~R$60) | 2 vCPUs, 4GB RAM, 80GB SSD |
| **Spaces (S3)** | $5/mês (~R$25) | 250GB armazenamento + 1TB transferência |
| **Domínio** | R$40/ano (~R$3/mês) | .com.br no Registro.br |
| **SSL** | GRATUITO | Let's Encrypt |
| **TOTAL** | **~R$88/mês** | Tudo incluído |

---

## 📋 Pré-requisitos

- [ ] Conta na DigitalOcean (cadastre-se em https://www.digitalocean.com)
- [ ] Domínio registrado (opcional, mas recomendado)
- [ ] Chave da API RapidAPI
- [ ] Conta Stripe configurada

---

## 🚀 Parte 1: Criar Droplet (Servidor)

### 1.1 Acessar DigitalOcean

1. Acesse https://cloud.digitalocean.com
2. Faça login na sua conta
3. Clique em **"Create"** → **"Droplets"**

### 1.2 Configurar Droplet

**Choose an image (Sistema Operacional)**:
- Selecione: **Ubuntu 22.04 (LTS) x64**

**Choose Size (Tamanho)**:
- Tipo: **Basic** (Shared CPU)
- CPU: **Regular**
- Plano: **$12/mo** (2 GB RAM / 1 vCPU / 50 GB SSD)
  - ⚠️ Se possível, escolha **$18/mo** (4 GB RAM / 2 vCPUs / 80 GB SSD) para melhor performance

**Choose a datacenter region (Localização)**:
- **Recomendado**: São Paulo 1 (Brasil) - menor latência
- **Alternativa**: New York 1 (EUA) - mais barato

**Authentication (Autenticação)**:
- Escolha: **Password** (mais simples)
- Crie uma senha forte (mínimo 12 caracteres)
- 💡 **Dica**: Anote a senha em local seguro

**Finalize Details**:
- Hostname: `archrender-app` (ou nome de sua preferência)
- Tags: `production, nodejs, archrender` (opcional)

**Clique em "Create Droplet"**

⏱️ **Aguarde 1-2 minutos** para o Droplet ser criado.

### 1.3 Anotar Informações

Após criação, anote:
- ✅ **IP do Droplet**: Ex: `164.90.123.45`
- ✅ **Senha root**: A que você criou
- ✅ **Região**: Ex: São Paulo 1

---

## 🌐 Parte 2: Configurar Domínio (Opcional mas Recomendado)

### Opção A: Usar DNS da DigitalOcean (Recomendado)

#### 2.1 Adicionar Domínio na DigitalOcean

1. No painel da DigitalOcean, vá em **"Networking"** → **"Domains"**
2. Clique em **"Add Domain"**
3. Digite seu domínio: `seudominio.com.br`
4. Clique em **"Add Domain"**

#### 2.2 Criar Registros DNS

Crie os seguintes registros:

**Registro A (Principal)**:
- Type: `A`
- Hostname: `@`
- Will Direct To: Selecione seu Droplet
- TTL: `3600`

**Registro A (WWW)**:
- Type: `A`
- Hostname: `www`
- Will Direct To: Selecione seu Droplet
- TTL: `3600`

#### 2.3 Atualizar Nameservers no Registro.br

1. Acesse https://registro.br
2. Vá em **"Meus Domínios"** → Selecione seu domínio
3. Clique em **"Alterar Servidores DNS"**
4. Adicione os nameservers da DigitalOcean:
   ```
   ns1.digitalocean.com
   ns2.digitalocean.com
   ns3.digitalocean.com
   ```
5. Salve as alterações

⏱️ **Aguarde 1-24h** para propagação DNS completa.

### Opção B: Usar DNS do Registro.br

Se preferir manter o DNS no Registro.br:

1. Acesse o painel do Registro.br
2. Configure registro A:
   - Tipo: `A`
   - Nome: `@`
   - Valor: `164.90.123.45` (IP do seu Droplet)
3. Configure registro A para www:
   - Tipo: `A`
   - Nome: `www`
   - Valor: `164.90.123.45`

---

## 💾 Parte 3: Configurar DigitalOcean Spaces (S3)

### 3.1 Criar Space

1. No painel DigitalOcean, vá em **"Manage"** → **"Spaces"**
2. Clique em **"Create Space"**

**Configurações**:
- **Datacenter**: Escolha a mesma região do Droplet (ex: São Paulo 1)
- **Enable CDN**: ✅ Marque (acelera carregamento de imagens)
- **Space Name**: `archrender-images` (ou nome de sua preferência)
- **File Listing**: Restrict File Listing (recomendado)

3. Clique em **"Create Space"**

### 3.2 Obter Credenciais

1. Vá em **"API"** → **"Spaces Keys"**
2. Clique em **"Generate New Key"**
3. Nome: `archrender-app`
4. Clique em **"Generate Key"**

⚠️ **IMPORTANTE**: Anote imediatamente:
- ✅ **Access Key**: Ex: `DO00ABCDEFGHIJKLMNOP`
- ✅ **Secret Key**: Ex: `abc123def456ghi789jkl012mno345pqr678stu901vwx234yz`
- ⚠️ A Secret Key só é mostrada uma vez!

### 3.3 Anotar Endpoint

O endpoint do seu Space será:
```
https://archrender-images.sao1.digitaloceanspaces.com
```

Formato: `https://[SPACE_NAME].[REGION].digitaloceanspaces.com`

---

## 🔧 Parte 4: Instalar Aplicação

### 4.1 Conectar ao Servidor via SSH

**No Windows (PowerShell ou CMD)**:
```bash
ssh root@164.90.123.45
```

**No Mac/Linux (Terminal)**:
```bash
ssh root@164.90.123.45
```

Digite `yes` quando perguntado sobre fingerprint.
Digite a senha que você criou.

### 4.2 Executar Script de Instalação

```bash
# Clonar repositório
git clone https://github.com/israelisd1/arch-render-app.git
cd arch-render-app

# Executar instalação automática
sudo ./install.sh
```

O script irá solicitar:
1. **Domínio**: Digite `seudominio.com.br` (ou deixe em branco se não tiver)
2. **Email**: Seu email para certificado SSL
3. **Senha do banco**: Crie uma senha forte (ex: `Arch@2024!Secure`)

⏱️ **Aguarde 10-15 minutos** para instalação completa.

### 4.3 Configurar Variáveis de Ambiente

Após instalação, edite o arquivo `.env`:

```bash
sudo nano /home/archrender/arch-render-app/.env
```

**Adicione/atualize as seguintes variáveis**:

```env
# Database (já configurado pelo script)
DATABASE_URL=postgresql://archrender_user:SUA_SENHA@localhost:5432/archrender

# JWT (já configurado pelo script)
JWT_SECRET=chave_gerada_automaticamente

# DigitalOcean Spaces (S3)
AWS_ACCESS_KEY_ID=DO00ABCDEFGHIJKLMNOP
AWS_SECRET_ACCESS_KEY=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
AWS_REGION=sao1
AWS_BUCKET_NAME=archrender-images
AWS_ENDPOINT=https://sao1.digitaloceanspaces.com
S3_PUBLIC_URL=https://archrender-images.sao1.cdn.digitaloceanspaces.com

# RapidAPI
RAPIDAPI_KEY=sua_chave_rapidapi_aqui

# Stripe
STRIPE_SECRET_KEY=sk_live_sua_chave_aqui
STRIPE_PUBLISHABLE_KEY=pk_live_sua_chave_aqui
STRIPE_WEBHOOK_SECRET=whsec_sua_chave_aqui

# OAuth (se usar Manus)
OAUTH_SERVER_URL=https://api.manus.im
OWNER_OPEN_ID=seu_owner_open_id
OWNER_NAME=Seu Nome

# App Config
VITE_APP_TITLE=Arqrender
VITE_APP_LOGO=/logo.png
VITE_APP_ID=archrender-prod
PORT=3000
NODE_ENV=production
```

**Salvar**: `Ctrl + O` → `Enter` → `Ctrl + X`

### 4.4 Atualizar Código para usar Spaces

Edite o arquivo de configuração do servidor:

```bash
sudo nano /home/archrender/arch-render-app/server/storage.ts
```

Se o arquivo não existir, crie-o com o seguinte conteúdo:

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT,
  region: process.env.AWS_REGION || "sao1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: false, // DigitalOcean Spaces usa virtual-hosted-style
});

export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: "public-read",
  });

  await s3Client.send(command);

  // Retornar URL pública via CDN
  const publicUrl = `${process.env.S3_PUBLIC_URL}/${key}`;
  return publicUrl;
}

export async function getSignedUrlFromS3(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return signedUrl;
}
```

### 4.5 Instalar Dependências do S3

```bash
cd /home/archrender/arch-render-app
sudo -u archrender pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 4.6 Rebuild e Reiniciar

```bash
cd /home/archrender/arch-render-app
sudo -u archrender pnpm build
sudo -u archrender pm2 restart arch-render-app
```

---

## ✅ Parte 5: Verificar Instalação

### 5.1 Verificar Status

```bash
# Status da aplicação
sudo -u archrender pm2 status

# Ver logs
sudo -u archrender pm2 logs arch-render-app --lines 50

# Status do Nginx
sudo systemctl status nginx

# Status do PostgreSQL
sudo systemctl status postgresql
```

### 5.2 Testar Acesso

**Com domínio**:
- Acesse: `https://seudominio.com.br`

**Sem domínio** (temporário):
- Acesse: `http://164.90.123.45`

### 5.3 Verificar SSL

Se configurou domínio, verifique se HTTPS está funcionando:
```bash
curl -I https://seudominio.com.br
```

Deve retornar `HTTP/2 200` ou `HTTP/1.1 200`

---

## 🔒 Parte 6: Segurança Adicional (Recomendado)

### 6.1 Configurar Firewall na DigitalOcean

1. No painel DigitalOcean, vá em **"Networking"** → **"Firewalls"**
2. Clique em **"Create Firewall"**
3. Nome: `archrender-firewall`

**Inbound Rules** (Regras de Entrada):
- SSH: TCP / 22 / All IPv4, All IPv6
- HTTP: TCP / 80 / All IPv4, All IPv6
- HTTPS: TCP / 443 / All IPv4, All IPv6

**Outbound Rules** (Regras de Saída):
- All TCP / All ports / All IPv4, All IPv6
- All UDP / All ports / All IPv4, All IPv6

4. Em **"Apply to Droplets"**, selecione seu Droplet
5. Clique em **"Create Firewall"**

### 6.2 Configurar Backups Automáticos

1. No painel do Droplet, vá em **"Backups"**
2. Clique em **"Enable Backups"**
3. Custo adicional: 20% do valor do Droplet (~$2.40/mês)

### 6.3 Configurar Monitoramento

1. No painel do Droplet, vá em **"Monitoring"**
2. Instale o agente de monitoramento:

```bash
curl -sSL https://repos.insights.digitalocean.com/install.sh | sudo bash
```

---

## 📊 Parte 7: Monitoramento e Manutenção

### 7.1 Comandos Úteis

```bash
# Ver logs em tempo real
sudo -u archrender pm2 logs arch-render-app

# Reiniciar aplicação
sudo -u archrender pm2 restart arch-render-app

# Ver uso de recursos
sudo -u archrender pm2 monit

# Ver espaço em disco
df -h

# Ver uso de memória
free -h

# Ver processos
htop
```

### 7.2 Atualizar Aplicação

```bash
cd /home/archrender/arch-render-app
sudo -u archrender ./deploy.sh
```

### 7.3 Backup Manual do Banco

```bash
# Criar backup
sudo -u postgres pg_dump archrender > backup_$(date +%Y%m%d).sql

# Restaurar backup
sudo -u postgres psql archrender < backup_20240101.sql
```

---

## 💡 Dicas e Otimizações

### Reduzir Custos

1. **Use o CDN do Spaces**: Já incluído, acelera e reduz custos de transferência
2. **Configure compressão de imagens**: Reduza tamanho antes de salvar no S3
3. **Implemente cache**: Use Redis para cache de dados frequentes

### Melhorar Performance

1. **Upgrade do Droplet**: Se necessário, aumente para 4GB RAM
2. **Use Managed Database**: DigitalOcean oferece PostgreSQL gerenciado ($15/mês)
3. **Configure CDN**: Use Cloudflare (gratuito) na frente do seu domínio

### Escalabilidade

Quando crescer, considere:
- **Load Balancer**: Distribua tráfego entre múltiplos Droplets
- **Managed Kubernetes**: Para aplicações muito grandes
- **App Platform**: Deploy simplificado da DigitalOcean

---

## 🆘 Troubleshooting

### Erro: "Cannot connect to database"

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Verificar conexão
sudo -u postgres psql -l
```

### Erro: "502 Bad Gateway"

```bash
# Verificar se aplicação está rodando
sudo -u archrender pm2 status

# Reiniciar aplicação
sudo -u archrender pm2 restart arch-render-app

# Ver logs
sudo -u archrender pm2 logs arch-render-app --lines 100
```

### Erro: "SSL certificate error"

```bash
# Renovar certificado manualmente
sudo certbot renew

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Espaço em disco cheio

```bash
# Ver uso de disco
df -h

# Limpar logs antigos
sudo -u archrender pm2 flush

# Limpar cache do npm
sudo -u archrender pnpm store prune
```

---

## 📞 Suporte

- **Documentação DigitalOcean**: https://docs.digitalocean.com
- **Community**: https://www.digitalocean.com/community
- **Suporte 24/7**: Disponível para contas pagas
- **GitHub Issues**: https://github.com/israelisd1/arch-render-app/issues

---

## 📝 Checklist Final

- [ ] Droplet criado e rodando
- [ ] Domínio configurado e propagado
- [ ] Space (S3) criado e configurado
- [ ] Aplicação instalada via `install.sh`
- [ ] Variáveis de ambiente configuradas
- [ ] SSL/HTTPS funcionando
- [ ] Upload de imagens testado
- [ ] Renderização com IA testada
- [ ] Pagamento Stripe testado
- [ ] Backup automático configurado
- [ ] Monitoramento ativo
- [ ] Firewall configurado

---

**Parabéns! Sua aplicação está no ar! 🎉**

Acesse: `https://seudominio.com.br`

