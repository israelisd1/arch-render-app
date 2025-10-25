import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />}
            <h1 className="text-xl font-bold text-white">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-300">Olá, {user?.name}</span>
                <Link href="/history">
                  <Button variant="ghost" className="text-white hover:bg-white/10">
                    Histórico
                  </Button>
                </Link>
                <Button variant="ghost" onClick={logout} className="text-white hover:bg-white/10">
                  Sair
                </Button>
              </>
            ) : (
              <Button asChild variant="default">
                <a href={getLoginUrl()}>Entrar</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-5xl font-bold text-amber-900 md:text-6xl">
            Renderização Arquitetônica
            <span className="block bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              com Inteligência Artificial
            </span>
          </h2>
          <p className="mb-8 text-xl text-amber-800">
            Transforme seus desenhos 2D em renderizações fotorrealistas de alta qualidade em segundos.
            Perfeito para arquitetos, designers de interiores e profissionais da construção.
          </p>
          
          {isAuthenticated ? (
            <Link href="/render">
              <Button size="lg" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-lg px-8 py-6">
                Começar a Renderizar
              </Button>
            </Link>
          ) : (
            <Button asChild size="lg" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-lg px-8 py-6">
              <a href={getLoginUrl()}>Começar Agora</a>
            </Button>
          )}
        </div>

        {/* Features */}
        <div className="mt-20 grid gap-8 md:grid-cols-3">
          <div className="rounded-xl border border-amber-200 bg-white/90 p-6 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
            <div className="mb-4 text-4xl">⚡</div>
            <h3 className="mb-2 text-xl font-semibold text-amber-900">Rápido</h3>
            <p className="text-amber-700">
              Renderizações em 10-30 segundos. Sem espera, sem complicação.
            </p>
          </div>
          
          <div className="rounded-xl border border-amber-200 bg-white/90 p-6 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
            <div className="mb-4 text-4xl">🎨</div>
            <h3 className="mb-2 text-xl font-semibold text-amber-900">Realista</h3>
            <p className="text-amber-700">
              IA avançada que preserva geometria e adiciona iluminação realista automaticamente.
            </p>
          </div>
          
          <div className="rounded-xl border border-amber-200 bg-white/90 p-6 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
            <div className="mb-4 text-4xl">🏭</div>
            <h3 className="mb-2 text-xl font-semibold text-amber-900">Profissional</h3>
            <p className="text-amber-700">
              Usado por arquitetos e designers em mais de 90 países.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
