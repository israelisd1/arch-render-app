import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Coins, ShoppingCart } from "lucide-react";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />
            <span className="font-bold text-xl">{APP_TITLE}</span>
          </a>
        </Link>
        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-white/80">Olá, {user?.name}</span>
              <div className="flex items-center gap-2">
                <Link href="/tokens">
                  <a className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-full hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors border border-amber-300 dark:border-amber-700">
                    <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-amber-900 dark:text-amber-100 font-semibold">{user?.tokenBalance || 0}</span>
                  </a>
                </Link>
                <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                  <Link href="/tokens">
                    <a className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Comprar Tokens
                    </a>
                  </Link>
                </Button>
              </div>
              <Link href="/render">
                <a className="text-white/80 hover:text-white transition-colors">Nova Renderização</a>
              </Link>
              <Link href="/history">
                <a className="text-white/80 hover:text-white transition-colors">Histórico</a>
              </Link>
              <Button variant="ghost" onClick={logout} className="text-white/80 hover:text-white hover:bg-white/10">
                Sair
              </Button>
            </>
          ) : (
            <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
              <a href={getLoginUrl()}>Fazer Login</a>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

