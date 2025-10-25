import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { t } = useLanguage();
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
            {t("home.title")}
            <span className="block bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {t("home.subtitle")}
            </span>
          </h2>
          <p className="mb-8 text-xl text-amber-800">
            {t("home.description")}
          </p>
          
          {isAuthenticated ? (
            <Link href="/render">
              <Button size="lg" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-lg px-8 py-6">
                {t("home.cta")}
              </Button>
            </Link>
          ) : (
            <Button asChild size="lg" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-lg px-8 py-6">
              <a href={getLoginUrl()}>{t("home.ctaLogin")}</a>
            </Button>
          )}
        </div>

        {/* Features */}
        <div className="mt-20 grid gap-8 md:grid-cols-3">
          <div className="rounded-xl border border-amber-200 bg-white/90 p-6 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
            <div className="mb-4 text-4xl">⚡</div>
            <h3 className="mb-2 text-xl font-semibold text-amber-900">{t("home.feature1.title")}</h3>
            <p className="text-amber-700">
              {t("home.feature1.description")}
            </p>
          </div>
          
          <div className="rounded-xl border border-amber-200 bg-white/90 p-6 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
            <div className="mb-4 text-4xl">🎨</div>
            <h3 className="mb-2 text-xl font-semibold text-amber-900">{t("home.feature2.title")}</h3>
            <p className="text-amber-700">
              {t("home.feature2.description")}
            </p>
          </div>
          
          <div className="rounded-xl border border-amber-200 bg-white/90 p-6 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
            <div className="mb-4 text-4xl">🏭</div>
            <h3 className="mb-2 text-xl font-semibold text-amber-900">{t("home.feature3.title")}</h3>
            <p className="text-amber-700">
              {t("home.feature3.description")}
            </p>
          </div>
        </div>

        {/* Before/After Slider Section */}
        <div className="mt-32">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-amber-900 mb-3">
              {t("slider.sectionTitle")}
            </h3>
            <p className="text-xl text-amber-700">
              {t("slider.sectionSubtitle")}
            </p>
          </div>
          <BeforeAfterSlider
            beforeImage="/example-before.jpg"
            afterImage="/example-after.jpg"
          />
        </div>
      </main>
    </div>
  );
}
