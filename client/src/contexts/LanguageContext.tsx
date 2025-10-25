import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "pt-BR" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  "pt-BR": {
    // Header
    "header.hello": "Olá",
    "header.tokens": "tokens",
    "header.buyTokens": "Comprar Tokens",
    "header.newRender": "Nova Renderização",
    "header.history": "Histórico",
    "header.logout": "Sair",
    "header.login": "Fazer Login",
    
    // Home
    "home.title": "Renderização Arquitetônica",
    "home.subtitle": "com Algoritmos Avançados",
    "home.description": "Transforme seus desenhos 2D em renderizações fotorrealistas de alta qualidade em segundos. Perfeito para arquitetos, designers de interiores e profissionais da construção.",
    "home.cta": "Começar a Renderizar",
    "home.ctaLogin": "Começar Agora",
    "home.feature1.title": "Rápido",
    "home.feature1.description": "Renderizações em 10-30 segundos. Sem espera, sem complicação.",
    "home.feature2.title": "Realista",
    "home.feature2.description": "Algoritmos avançados que preservam geometria e adicionam iluminação realista automaticamente.",
    "home.feature3.title": "Profissional",
    "home.feature3.description": "Usado por arquitetos e designers em mais de 90 países.",
    
    // Render Page
    "render.title": "Nova Renderização",
    "render.authRequired": "Autenticação Necessária",
    "render.authDescription": "Você precisa estar autenticado para criar renderizações.",
    "render.uploadImage": "Upload de Imagem",
    "render.uploadDescription": "Envie sua imagem 2D (planta, esboço ou render básico)",
    "render.selectImage": "Selecionar Imagem",
    "render.sceneType": "Tipo de Cena",
    "render.interior": "Interior",
    "render.exterior": "Exterior",
    "render.outputFormat": "Formato de Saída",
    "render.prompt": "Descrição/Orientações (opcional)",
    "render.promptPlaceholder": "Ex: Estilo moderno, iluminação natural, cores neutras...",
    "render.promptHelp": "Descreva o estilo e atmosfera desejados para a renderização",
    "render.submit": "Iniciar Renderização",
    "render.processing": "Processando...",
    
    // History Page
    "history.title": "Histórico de Renderizações",
    "history.newRender": "+ Nova Renderização",
    "history.empty": "Nenhuma renderização encontrada",
    "history.createFirst": "Criar sua primeira renderização",
    "history.status.processing": "Processando",
    "history.status.completed": "Concluído",
    "history.status.failed": "Falhou",
    "history.download": "Baixar Imagem",
    "history.refine": "Refinar",
    "history.error": "Erro",
    
    // Tokens Page
    "tokens.title": "Compre",
    "tokens.titleHighlight": "Tokens",
    "tokens.description": "Cada renderização consome 1 token. Escolha o pacote ideal para suas necessidades.",
    "tokens.currentBalance": "Saldo atual:",
    "tokens.package": "Pacote",
    "tokens.popular": "Mais Popular",
    "tokens.perToken": "por token",
    "tokens.renders": "renderizações",
    "tokens.highQuality": "Alta qualidade",
    "tokens.noExpiration": "Sem expiração",
    "tokens.buyNow": "Comprar Agora",
    "tokens.note": "💡 Nota: Este é um sistema de demonstração. Nenhum pagamento real é processado.",
    
    // Refine Dialog
    "refine.title": "Refinar Renderização",
    "refine.description": "Adicione instruções para refinar a renderização existente",
    "refine.prompt": "Prompt de Refinamento",
    "refine.promptPlaceholder": "Ex: Adicionar mais luz natural, mudar cores para tons quentes...",
    "refine.cancel": "Cancelar",
    "refine.submit": "Iniciar Refinamento",
    "refine.processing": "Refinando...",
    
    // CTA Section
    "cta.title": "Comece Gratuitamente Hoje",
    "cta.subtitle": "Cadastre-se agora e ganhe",
    "cta.tokensHighlight": "3 tokens gratuitos",
    "cta.description": "para testar nossa plataforma. Cada token permite criar uma renderização de alta qualidade.",
    "cta.button": "Criar Conta Grátis",
    
    // Before/After Slider
    "slider.before": "Antes (2D)",
    "slider.after": "Depois (Renderizado)",
    "slider.instruction": "Arraste o controle para comparar antes e depois",
    "slider.sectionTitle": "Veja a Transformação",
    "slider.sectionSubtitle": "Resultados Reais de Projetos",
    
    // Insufficient Tokens Dialog
    "insufficientTokens.title": "Saldo de Tokens Insuficiente",
    "insufficientTokens.description": "Você precisa de pelo menos 1 token para criar uma renderização.",
    "insufficientTokens.currentBalance": "Saldo atual:",
    "insufficientTokens.message": "Cada renderização consome 1 token. Compre mais tokens para continuar criando renderizações incríveis!",
    "insufficientTokens.cancel": "Cancelar",
    "insufficientTokens.buy": "Comprar Tokens",
  },
  "en": {
    // Header
    "header.hello": "Hello",
    "header.tokens": "tokens",
    "header.buyTokens": "Buy Tokens",
    "header.newRender": "New Render",
    "header.history": "History",
    "header.logout": "Logout",
    "header.login": "Sign In",
    
    // Home
    "home.title": "Architectural Rendering",
    "home.subtitle": "with Advanced Algorithms",
    "home.description": "Transform your 2D drawings into photorealistic high-quality renderings in seconds. Perfect for architects, interior designers, and construction professionals.",
    "home.cta": "Start Rendering",
    "home.ctaLogin": "Get Started",
    "home.feature1.title": "Fast",
    "home.feature1.description": "Renderings in 10-30 seconds. No waiting, no hassle.",
    "home.feature2.title": "Realistic",
    "home.feature2.description": "Advanced algorithms that preserve geometry and add realistic lighting automatically.",
    "home.feature3.title": "Professional",
    "home.feature3.description": "Used by architects and designers in over 90 countries.",
    
    // Render Page
    "render.title": "New Rendering",
    "render.authRequired": "Authentication Required",
    "render.authDescription": "You need to be authenticated to create renderings.",
    "render.uploadImage": "Image Upload",
    "render.uploadDescription": "Upload your 2D image (floor plan, sketch, or basic render)",
    "render.selectImage": "Select Image",
    "render.sceneType": "Scene Type",
    "render.interior": "Interior",
    "render.exterior": "Exterior",
    "render.outputFormat": "Output Format",
    "render.prompt": "Description/Instructions (optional)",
    "render.promptPlaceholder": "E.g.: Modern style, natural lighting, neutral colors...",
    "render.promptHelp": "Describe the desired style and atmosphere for the rendering",
    "render.submit": "Start Rendering",
    "render.processing": "Processing...",
    
    // History Page
    "history.title": "Rendering History",
    "history.newRender": "+ New Rendering",
    "history.empty": "No renderings found",
    "history.createFirst": "Create your first rendering",
    "history.status.processing": "Processing",
    "history.status.completed": "Completed",
    "history.status.failed": "Failed",
    "history.download": "Download Image",
    "history.refine": "Refine",
    "history.error": "Error",
    
    // Tokens Page
    "tokens.title": "Buy",
    "tokens.titleHighlight": "Tokens",
    "tokens.description": "Each rendering consumes 1 token. Choose the ideal package for your needs.",
    "tokens.currentBalance": "Current balance:",
    "tokens.package": "Package",
    "tokens.popular": "Most Popular",
    "tokens.perToken": "per token",
    "tokens.renders": "renderings",
    "tokens.highQuality": "High quality",
    "tokens.noExpiration": "No expiration",
    "tokens.buyNow": "Buy Now",
    "tokens.note": "💡 Note: This is a demonstration system. No real payment is processed.",
    
    // Refine Dialog
    "refine.title": "Refine Rendering",
    "refine.description": "Add instructions to refine the existing rendering",
    "refine.prompt": "Refinement Prompt",
    "refine.promptPlaceholder": "E.g.: Add more natural light, change colors to warm tones...",
    "refine.cancel": "Cancel",
    "refine.submit": "Start Refinement",
    "refine.processing": "Refining...",
    
    // CTA Section
    "cta.title": "Start Free Today",
    "cta.subtitle": "Sign up now and get",
    "cta.tokensHighlight": "3 free tokens",
    "cta.description": "to test our platform. Each token allows you to create one high-quality rendering.",
    "cta.button": "Sign Up Free",
    
    // Before/After Slider
    "slider.before": "Before (2D)",
    "slider.after": "After (Rendered)",
    "slider.instruction": "Drag the slider to compare before and after",
    "slider.sectionTitle": "See the Transformation",
    "slider.sectionSubtitle": "Real Project Results",
    
    // Insufficient Tokens Dialog
    "insufficientTokens.title": "Insufficient Token Balance",
    "insufficientTokens.description": "You need at least 1 token to create a rendering.",
    "insufficientTokens.currentBalance": "Current balance:",
    "insufficientTokens.message": "Each rendering consumes 1 token. Buy more tokens to continue creating amazing renderings!",
    "insufficientTokens.cancel": "Cancel",
    "insufficientTokens.buy": "Buy Tokens",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "pt-BR";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations["pt-BR"]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

