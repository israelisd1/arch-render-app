import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import { Check, Coins } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CheckoutSuccess() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [location] = useLocation();
  const utils = trpc.useUtils();

  // Extrair session_id da URL
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");

  useEffect(() => {
    // Invalidar cache do usuário para atualizar saldo
    utils.auth.me.invalidate();
  }, [utils]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <Header />

      <main className="container py-12 flex items-center justify-center min-h-[80vh]">
        <Card className="max-w-md bg-white/80 backdrop-blur border-green-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-900">
              {t("home.paymentSuccess") || "Pagamento Confirmado!"}
            </CardTitle>
            <CardDescription className="text-green-700">
              {t("home.tokensAdded") || "Seus tokens foram adicionados à sua conta"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-green-900">
                <Coins className="w-5 h-5" />
                <span className="font-semibold">
                  {t("home.currentBalance") || "Saldo Atual"}:{" "}
                  {user?.tokenBalance || 0} tokens
                </span>
              </div>
            </div>

            <div className="text-sm text-gray-600 text-center">
              <p>{t("home.thankYou") || "Obrigado pela sua compra!"}</p>
              <p className="mt-1">
                {t("home.readyToRender") ||
                  "Agora você está pronto para criar renderizações incríveis."}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                asChild
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              >
                <Link href="/render">
                  {t("home.startRendering") || "Começar a Renderizar"}
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full border-amber-300">
                <Link href="/history">
                  {t("home.viewHistory") || "Ver Histórico"}
                </Link>
              </Button>
            </div>

            {sessionId && (
              <p className="text-xs text-gray-500 text-center">
                ID da transação: {sessionId.substring(0, 20)}...
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

