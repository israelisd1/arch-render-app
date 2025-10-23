import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Coins } from "lucide-react";

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
              <Link href="/tokens">
                <a className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20 transition-colors">
                  <Coins className="h-4 w-4 text-yellow-400" />
                  <span className="text-white font-semibold">{user?.tokenBalance || 0}</span>
                </a>
              </Link>
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

