# ✅ Checklist de Deploy

Use este checklist para garantir que todos os passos foram seguidos corretamente.

## Pré-Deploy

- [ ] Servidor VPS contratado (mínimo 2 vCPUs, 4GB RAM)
- [ ] Domínio registrado e apontando para o IP do servidor
- [ ] Conta RapidAPI criada e chave obtida
- [ ] Conta Stripe configurada (chaves de produção)
- [ ] Sistema de autenticação OAuth configurado (ou alternativa)

## Instalação do Servidor

- [ ] Ubuntu 22.04 LTS instalado
- [ ] Acesso SSH funcionando
- [ ] Firewall UFW instalado
- [ ] Node.js 22.x instalado
- [ ] PostgreSQL instalado e rodando
- [ ] Nginx instalado
- [ ] PM2 instalado globalmente
- [ ] Certbot instalado

## Configuração do Banco de Dados

- [ ] Banco de dados `archrender` criado
- [ ] Usuário `archrender_user` criado
- [ ] Permissões concedidas
- [ ] Conexão testada

## Configuração da Aplicação

- [ ] Repositório clonado em `/home/archrender/arch-render-app`
- [ ] Dependências instaladas (`pnpm install`)
- [ ] Arquivo `.env` criado e configurado
- [ ] Todas as variáveis de ambiente preenchidas:
  - [ ] `DATABASE_URL`
  - [ ] `JWT_SECRET`
  - [ ] `RAPIDAPI_KEY`
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_PUBLISHABLE_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] `OAUTH_SERVER_URL`
  - [ ] `OWNER_OPEN_ID`
  - [ ] `OWNER_NAME`
- [ ] Migrations aplicadas (`pnpm db:push`)
- [ ] Build executado com sucesso (`pnpm build`)

## Configuração PM2

- [ ] PM2 iniciado com `ecosystem.config.js`
- [ ] Aplicação rodando (verificar com `pm2 status`)
- [ ] PM2 configurado para iniciar no boot (`pm2 startup`)
- [ ] Configuração salva (`pm2 save`)
- [ ] Logs funcionando (`pm2 logs`)

## Configuração Nginx

- [ ] Arquivo de configuração criado em `/etc/nginx/sites-available/archrender`
- [ ] Link simbólico criado em `/etc/nginx/sites-enabled/`
- [ ] Site padrão removido
- [ ] Domínio configurado corretamente
- [ ] Configuração testada (`nginx -t`)
- [ ] Nginx reiniciado
- [ ] Site acessível via HTTP

## Configuração SSL/HTTPS

- [ ] Certbot executado com sucesso
- [ ] Certificado SSL obtido
- [ ] HTTPS funcionando
- [ ] Redirecionamento HTTP → HTTPS ativo
- [ ] Renovação automática configurada

## Configuração de Segurança

- [ ] Firewall UFW ativo
- [ ] Apenas portas 22, 80, 443 abertas
- [ ] Autenticação SSH por chave configurada (opcional mas recomendado)
- [ ] Login root via SSH desabilitado (opcional mas recomendado)
- [ ] Atualizações automáticas de segurança configuradas
- [ ] Fail2ban instalado e configurado (opcional mas recomendado)

## Backup e Monitoramento

- [ ] Backup automático diário configurado
- [ ] Diretório de backups criado
- [ ] Teste de backup realizado
- [ ] Monitoramento PM2 funcionando
- [ ] Logs sendo gravados corretamente

## Testes Funcionais

- [ ] Página inicial carrega corretamente
- [ ] Login/autenticação funcionando
- [ ] Upload de imagem funciona
- [ ] Renderização com IA funciona
- [ ] Sistema de tokens funciona
- [ ] Compra de tokens funciona (Stripe)
- [ ] Webhook do Stripe configurado e testado
- [ ] Histórico de renderizações exibe corretamente
- [ ] Sistema de ajustes visuais funciona
- [ ] Download de imagens funciona
- [ ] Painel admin acessível (se aplicável)
- [ ] Troca de idioma PT/EN funciona

## Otimizações (Opcional)

- [ ] CDN configurado para assets estáticos
- [ ] Compressão Gzip/Brotli ativada no Nginx
- [ ] Cache de assets estáticos configurado
- [ ] Rate limiting configurado no Nginx
- [ ] Monitoramento de uptime configurado (UptimeRobot, etc.)
- [ ] Analytics configurado

## Pós-Deploy

- [ ] DNS propagado (pode levar até 48h)
- [ ] Domínio acessível via HTTPS
- [ ] Todas as funcionalidades testadas em produção
- [ ] Backup inicial do banco de dados realizado
- [ ] Documentação atualizada com URLs de produção
- [ ] Equipe/cliente notificado sobre o deploy
- [ ] Credenciais de acesso fornecidas

## Manutenção Contínua

- [ ] Monitoramento de logs configurado
- [ ] Alertas de erro configurados
- [ ] Processo de atualização documentado
- [ ] Plano de rollback definido
- [ ] Contato de suporte técnico definido

---

## Comandos de Verificação Rápida

```bash
# Verificar aplicação
sudo -u archrender pm2 status

# Verificar Nginx
sudo systemctl status nginx

# Verificar PostgreSQL
sudo systemctl status postgresql

# Verificar SSL
curl -I https://seu-dominio.com

# Verificar logs
sudo -u archrender pm2 logs arch-render-app --lines 50

# Verificar disco
df -h

# Verificar memória
free -h

# Verificar processos
top
```

---

**Data do Deploy**: _______________

**Responsável**: _______________

**Notas**: 
_______________________________________
_______________________________________
_______________________________________

