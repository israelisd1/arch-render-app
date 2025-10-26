#!/bin/bash

###############################################################################
# Script de Deploy Automatizado - DigitalOcean App Platform
# Arqrender - Renderização Arquitetônica com IA
###############################################################################

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de utilidade
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Verificar se doctl está instalado
check_doctl() {
    if ! command -v doctl &> /dev/null; then
        print_error "doctl não está instalado!"
        echo ""
        echo "Instale o doctl seguindo as instruções:"
        echo "https://docs.digitalocean.com/reference/doctl/how-to/install/"
        echo ""
        echo "macOS: brew install doctl"
        echo "Linux: snap install doctl"
        echo "Windows: scoop install doctl"
        exit 1
    fi
    print_success "doctl instalado"
}

# Verificar autenticação
check_auth() {
    if ! doctl auth list &> /dev/null; then
        print_error "doctl não está autenticado!"
        echo ""
        echo "Execute: doctl auth init"
        echo "E forneça seu Personal Access Token do DigitalOcean"
        exit 1
    fi
    print_success "doctl autenticado"
}

# Verificar se o arquivo .env.production existe
check_env_file() {
    if [ ! -f ".env.production" ]; then
        print_warning ".env.production não encontrado"
        echo ""
        echo "Criando arquivo .env.production de exemplo..."
        cat > .env.production << 'EOF'
# ============================================
# DIGITALOCEAN APP PLATFORM - VARIÁVEIS DE AMBIENTE
# ============================================
# Preencha este arquivo com suas credenciais reais
# NÃO commite este arquivo no Git!

# App Configuration
NODE_ENV=production
PORT=3000
VITE_APP_TITLE=Arqrender
VITE_APP_LOGO=/logo.png

# Database (será preenchido automaticamente pelo App Platform)
# DATABASE_URL será injetado automaticamente

# NextAuth (Autenticação)
# Gere em: https://generate-secret.vercel.app/32
NEXTAUTH_SECRET=CHANGE_ME_GENERATE_RANDOM_32_CHARS
NEXTAUTH_URL=https://your-app.ondigitalocean.app

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_1_TOKEN=price_your_price_id
STRIPE_PRICE_10_TOKENS=price_your_price_id
STRIPE_PRICE_50_TOKENS=price_your_price_id

# RapidAPI
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=architecture-rendering-api.p.rapidapi.com

# DigitalOcean Spaces (S3)
SPACES_REGION=nyc3
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
SPACES_BUCKET=arqrender-images
SPACES_ACCESS_KEY=DO00XXXXXXXXXXXX
SPACES_SECRET_KEY=your_secret_key
SPACES_CDN_ENDPOINT=https://arqrender-images.nyc3.cdn.digitaloceanspaces.com

# SMTP (Email - Opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@arqrender.com
EOF
        print_warning "Arquivo .env.production criado. PREENCHA-O antes de continuar!"
        exit 1
    fi
    print_success ".env.production encontrado"
}

# Criar app no App Platform
create_app() {
    print_header "CRIANDO APP NO APP PLATFORM"
    
    print_info "Verificando se o app já existe..."
    
    # Verificar se já existe um app com o nome
    if doctl apps list --format Name | grep -q "^arqrender$"; then
        print_warning "App 'arqrender' já existe!"
        read -p "Deseja atualizar o app existente? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            update_app
            return
        else
            print_info "Operação cancelada"
            exit 0
        fi
    fi
    
    print_info "Criando novo app..."
    
    # Criar app usando o app.yaml
    if [ -f ".do/app.yaml" ]; then
        doctl apps create --spec .do/app.yaml
        print_success "App criado com sucesso!"
    else
        print_error "Arquivo .do/app.yaml não encontrado!"
        exit 1
    fi
    
    # Obter ID do app
    APP_ID=$(doctl apps list --format ID,Name | grep "arqrender" | awk '{print $1}')
    
    if [ -z "$APP_ID" ]; then
        print_error "Não foi possível obter o ID do app"
        exit 1
    fi
    
    print_success "App ID: $APP_ID"
    
    # Aguardar deploy inicial
    print_info "Aguardando deploy inicial (isso pode levar 5-10 minutos)..."
    wait_for_deployment "$APP_ID"
    
    # Mostrar URL do app
    show_app_url "$APP_ID"
}

# Atualizar app existente
update_app() {
    print_header "ATUALIZANDO APP NO APP PLATFORM"
    
    # Obter ID do app
    APP_ID=$(doctl apps list --format ID,Name | grep "arqrender" | awk '{print $1}')
    
    if [ -z "$APP_ID" ]; then
        print_error "App 'arqrender' não encontrado!"
        print_info "Execute com --create para criar um novo app"
        exit 1
    fi
    
    print_info "App ID: $APP_ID"
    
    # Atualizar app usando o app.yaml
    if [ -f ".do/app.yaml" ]; then
        doctl apps update "$APP_ID" --spec .do/app.yaml
        print_success "App atualizado com sucesso!"
    else
        print_error "Arquivo .do/app.yaml não encontrado!"
        exit 1
    fi
    
    # Aguardar deploy
    print_info "Aguardando deploy (isso pode levar 3-5 minutos)..."
    wait_for_deployment "$APP_ID"
    
    # Mostrar URL do app
    show_app_url "$APP_ID"
}

# Atualizar variáveis de ambiente
update_env_vars() {
    print_header "ATUALIZANDO VARIÁVEIS DE AMBIENTE"
    
    # Obter ID do app
    APP_ID=$(doctl apps list --format ID,Name | grep "arqrender" | awk '{print $1}')
    
    if [ -z "$APP_ID" ]; then
        print_error "App 'arqrender' não encontrado!"
        exit 1
    fi
    
    print_info "Lendo variáveis de .env.production..."
    
    # Ler variáveis do .env.production e atualizar
    while IFS='=' read -r key value; do
        # Ignorar linhas vazias e comentários
        [[ -z "$key" || "$key" =~ ^#.*$ ]] && continue
        
        # Remover espaços em branco
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs)
        
        # Ignorar DATABASE_URL (é gerenciado pelo App Platform)
        [[ "$key" == "DATABASE_URL" ]] && continue
        
        print_info "Atualizando $key..."
        
        # Atualizar variável (isso requer usar a API diretamente)
        # Por limitação do doctl, vamos apenas informar ao usuário
        echo "  $key=$value"
    done < .env.production
    
    print_warning "As variáveis acima devem ser configuradas manualmente no App Platform:"
    print_info "1. Acesse: https://cloud.digitalocean.com/apps/$APP_ID/settings"
    print_info "2. Vá para 'App-Level Environment Variables'"
    print_info "3. Clique em 'Edit' e adicione as variáveis"
    print_info "4. Clique em 'Save' e faça redeploy"
}

# Aguardar deployment
wait_for_deployment() {
    local app_id=$1
    local max_attempts=60  # 10 minutos (10 segundos * 60)
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        # Obter status do último deployment
        status=$(doctl apps list-deployments "$app_id" --format Phase | head -n 2 | tail -n 1)
        
        case "$status" in
            "ACTIVE")
                print_success "Deploy concluído com sucesso!"
                return 0
                ;;
            "ERROR"|"FAILED")
                print_error "Deploy falhou!"
                print_info "Verifique os logs em: https://cloud.digitalocean.com/apps/$app_id"
                return 1
                ;;
            "PENDING_BUILD"|"BUILDING"|"PENDING_DEPLOY"|"DEPLOYING")
                echo -ne "\r${YELLOW}⏳ Status: $status... ($((attempt * 10))s)${NC}"
                sleep 10
                ((attempt++))
                ;;
            *)
                echo -ne "\r${YELLOW}⏳ Aguardando... ($((attempt * 10))s)${NC}"
                sleep 10
                ((attempt++))
                ;;
        esac
    done
    
    print_warning "Timeout aguardando deploy. Verifique manualmente."
    return 1
}

# Mostrar URL do app
show_app_url() {
    local app_id=$1
    
    print_header "INFORMAÇÕES DO APP"
    
    # Obter URL do app
    url=$(doctl apps get "$app_id" --format DefaultIngress | tail -n 1)
    
    if [ -n "$url" ]; then
        print_success "App disponível em:"
        echo -e "${GREEN}🌐 https://$url${NC}"
        echo ""
        print_info "Próximos passos:"
        echo "1. Acesse a URL acima para verificar o app"
        echo "2. Configure as variáveis de ambiente (se ainda não fez)"
        echo "3. Atualize Google OAuth e Stripe com a URL real"
        echo "4. Configure um domínio customizado (opcional)"
    else
        print_warning "Não foi possível obter a URL do app"
    fi
}

# Mostrar logs
show_logs() {
    print_header "LOGS DO APP"
    
    # Obter ID do app
    APP_ID=$(doctl apps list --format ID,Name | grep "arqrender" | awk '{print $1}')
    
    if [ -z "$APP_ID" ]; then
        print_error "App 'arqrender' não encontrado!"
        exit 1
    fi
    
    print_info "Abrindo logs no navegador..."
    print_info "URL: https://cloud.digitalocean.com/apps/$APP_ID/logs"
    
    # Tentar abrir no navegador
    if command -v xdg-open &> /dev/null; then
        xdg-open "https://cloud.digitalocean.com/apps/$APP_ID/logs"
    elif command -v open &> /dev/null; then
        open "https://cloud.digitalocean.com/apps/$APP_ID/logs"
    else
        print_warning "Não foi possível abrir o navegador automaticamente"
        echo "Acesse manualmente: https://cloud.digitalocean.com/apps/$APP_ID/logs"
    fi
}

# Deletar app
delete_app() {
    print_header "DELETAR APP"
    
    # Obter ID do app
    APP_ID=$(doctl apps list --format ID,Name | grep "arqrender" | awk '{print $1}')
    
    if [ -z "$APP_ID" ]; then
        print_error "App 'arqrender' não encontrado!"
        exit 1
    fi
    
    print_warning "ATENÇÃO: Isso vai deletar o app e todos os recursos associados!"
    read -p "Tem certeza? Digite 'arqrender' para confirmar: " confirm
    
    if [ "$confirm" != "arqrender" ]; then
        print_info "Operação cancelada"
        exit 0
    fi
    
    print_info "Deletando app..."
    doctl apps delete "$APP_ID" --force
    print_success "App deletado com sucesso!"
}

# Mostrar ajuda
show_help() {
    cat << EOF
${BLUE}========================================
Deploy Automatizado - App Platform
Arqrender
========================================${NC}

${GREEN}Uso:${NC}
  ./deploy-app-platform.sh [comando]

${GREEN}Comandos:${NC}
  ${YELLOW}create${NC}      Criar novo app no App Platform
  ${YELLOW}update${NC}      Atualizar app existente
  ${YELLOW}deploy${NC}      Fazer deploy/redeploy (alias para update)
  ${YELLOW}env${NC}         Mostrar instruções para atualizar variáveis de ambiente
  ${YELLOW}logs${NC}        Abrir logs do app no navegador
  ${YELLOW}info${NC}        Mostrar informações do app (URL, status)
  ${YELLOW}delete${NC}      Deletar app (cuidado!)
  ${YELLOW}help${NC}        Mostrar esta ajuda

${GREEN}Exemplos:${NC}
  # Criar app pela primeira vez
  ./deploy-app-platform.sh create

  # Atualizar app após mudanças no código
  git push origin main
  ./deploy-app-platform.sh deploy

  # Ver logs
  ./deploy-app-platform.sh logs

${GREEN}Pré-requisitos:${NC}
  1. doctl instalado e autenticado
  2. Arquivo .env.production preenchido
  3. Arquivo .do/app.yaml configurado
  4. Repositório GitHub conectado

${GREEN}Documentação:${NC}
  Guia completo: GUIA_INSTALACAO_COMPLETO.md
  App Platform: https://docs.digitalocean.com/products/app-platform/

EOF
}

# Main
main() {
    print_header "DEPLOY AUTOMATIZADO - APP PLATFORM"
    
    # Verificar pré-requisitos
    check_doctl
    check_auth
    check_env_file
    
    # Processar comando
    case "${1:-help}" in
        create)
            create_app
            ;;
        update|deploy)
            update_app
            ;;
        env)
            update_env_vars
            ;;
        logs)
            show_logs
            ;;
        info)
            APP_ID=$(doctl apps list --format ID,Name | grep "arqrender" | awk '{print $1}')
            if [ -n "$APP_ID" ]; then
                show_app_url "$APP_ID"
            else
                print_error "App não encontrado"
            fi
            ;;
        delete)
            delete_app
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Comando inválido: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Executar
main "$@"

