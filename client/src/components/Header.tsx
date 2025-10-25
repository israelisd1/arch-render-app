import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Coins, ShoppingCart, Menu, X, Globe } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-amber-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-2 text-amber-900 hover:opacity-80 transition-opacity cursor-pointer">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />
            <span className="font-bold text-lg md:text-xl truncate max-w-[150px] md:max-w-none">{APP_TITLE}</span>
          </div>
        </Link>
        
        <div className="flex items-center gap-2">
          {/* Language selector - always visible */}
          <button
            onClick={() => setLanguage(language === "pt-BR" ? "en" : "pt-BR")}
            className="flex items-center gap-1 px-2 py-1 text-sm text-amber-800 hover:bg-amber-100 rounded transition-colors"
            title={language === "pt-BR" ? "Switch to English" : "Mudar para Português"}
          >
            <Globe className="h-4 w-4" />
            <span className="font-medium">{language === "pt-BR" ? "PT" : "EN"}</span>
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-amber-900 hover:bg-amber-100 rounded"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-amber-800">{t("header.hello")}, {user?.name}</span>
              <div className="flex items-center gap-2">
                <Link href="/tokens">
                  <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-full hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors border border-amber-300 dark:border-amber-700 cursor-pointer">
                    <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-amber-900 dark:text-amber-100 font-semibold">{user?.tokenBalance || 0} {t("header.tokens")}</span>
                  </div>
                </Link>
                <Link href="/tokens">
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    {t("header.buyTokens")}
                  </Button>
                </Link>
              </div>
              <Link href="/render">
                <span className="text-amber-800 hover:text-amber-900 transition-colors cursor-pointer">{t("header.newRender")}</span>
              </Link>
              <Link href="/history">
                <span className="text-amber-800 hover:text-amber-900 transition-colors cursor-pointer">{t("header.history")}</span>
              </Link>
              {user?.email === "israelisd@gmail.com" && (
                <Link href="/admin">
                  <span className="text-amber-800 hover:text-amber-900 transition-colors cursor-pointer font-semibold">Admin</span>
                </Link>
              )}
              <Button variant="ghost" onClick={logout} className="text-amber-800 hover:text-amber-900 hover:bg-amber-100">
                {t("header.logout")}
              </Button>
            </>
          ) : (
            <Button asChild className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
              <a href={getLoginUrl()}>{t("header.login")}</a>
            </Button>
          )}
          </nav>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-amber-200 shadow-lg">
            {isAuthenticated ? (
              <div className="flex flex-col p-4 space-y-3">
                <div className="pb-3 border-b border-amber-200">
                  <span className="text-sm text-amber-800">{t("header.hello")}, {user?.name}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <Link href="/tokens">
                    <div className="flex items-center gap-2 bg-amber-100 px-3 py-2 rounded-lg hover:bg-amber-200 transition-colors border border-amber-300 cursor-pointer">
                      <Coins className="h-4 w-4 text-amber-600" />
                      <span className="text-amber-900 font-semibold">{user?.tokenBalance || 0} {t("header.tokens")}</span>
                    </div>
                  </Link>
                  <Link href="/tokens">
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      {t("header.buyTokens").split(" ")[0]}
                    </Button>
                  </Link>
                </div>
                <Link href="/render">
                  <span className="block py-2 text-amber-800 hover:text-amber-900 transition-colors cursor-pointer">{t("header.newRender")}</span>
                </Link>
                <Link href="/history">
                  <span className="block py-2 text-amber-800 hover:text-amber-900 transition-colors cursor-pointer">{t("header.history")}</span>
                </Link>
                {user?.email === "israelisd@gmail.com" && (
                  <Link href="/admin">
                    <span className="block py-2 text-amber-800 hover:text-amber-900 transition-colors cursor-pointer font-semibold">Admin</span>
                  </Link>
                )}
                <Button variant="outline" onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full border-amber-300 text-amber-900 hover:bg-amber-50">
                  {t("header.logout")}
                </Button>
              </div>
            ) : (
              <div className="p-4">
                <Button asChild className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
                  <a href={getLoginUrl()}>{t("header.login")}</a>
                </Button>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

