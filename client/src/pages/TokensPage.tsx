import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Check, Coins, Loader2, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TokensPage() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { data: packages, isLoading: packagesLoading } = trpc.tokens.listPackages.useQuery();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    discountType: "percentage" | "fixed";
    discountValue: number;
  } | null>(null);

  const validateCouponMutation = trpc.tokens.validateCoupon.useMutation({
    onSuccess: (data) => {
      setAppliedCoupon({
        discountType: data.discountType,
        discountValue: data.discountValue,
      });
      toast.success(
        t("home.couponApplied") ||
          `Cupom aplicado! Desconto de ${
            data.discountType === "percentage"
              ? `${data.discountValue}%`
              : `R$ ${(data.discountValue / 100).toFixed(2)}`
          }`
      );
    },
    onError: (error) => {
      toast.error(error.message);
      setAppliedCoupon(null);
    },
  });

  const createCheckoutMutation = trpc.tokens.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        // Redirecionar para página de checkout do Stripe
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error) => {
      toast.error(`Erro ao criar checkout: ${error.message}`);
    },
  });

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error(t("home.enterCoupon") || "Digite um código de cupom");
      return;
    }
    validateCouponMutation.mutate({ code: couponCode.trim() });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const handlePurchase = (packageId: number) => {
    setSelectedPackage(packageId);
    createCheckoutMutation.mutate({
      packageId,
      couponCode: appliedCoupon ? couponCode : undefined,
    });
  };

  const calculateFinalPrice = (priceInCents: number) => {
    if (!appliedCoupon) return priceInCents;

    if (appliedCoupon.discountType === "percentage") {
      return priceInCents - Math.floor((priceInCents * appliedCoupon.discountValue) / 100);
    } else {
      return Math.max(0, priceInCents - appliedCoupon.discountValue);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <Card className="bg-white/80 backdrop-blur-md border-amber-200 max-w-md">
          <CardHeader>
            <CardTitle className="text-amber-900">
              {t("home.authRequired") || "Autenticação Necessária"}
            </CardTitle>
            <CardDescription className="text-amber-700">
              {t("home.loginToBuyTokens") || "Faça login para comprar tokens"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
            >
              <a href={getLoginUrl()}>{t("home.login") || "Fazer Login"}</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <Header />

      <main className="container py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 px-4 py-2 rounded-full mb-4">
              <Coins className="w-5 h-5" />
              <span className="font-semibold">
                {t("home.yourBalance") || "Seu Saldo"}:{" "}
                {user?.tokenBalance || 0} tokens
              </span>
            </div>
            <h1 className="text-4xl font-bold text-amber-900 mb-4">
              {t("home.buyTokens") || "Comprar Tokens"}
            </h1>
            <p className="text-lg text-amber-700 max-w-2xl mx-auto">
              {t("home.choosePackage") ||
                "Escolha o pacote ideal para suas necessidades. Quanto maior o pacote, maior o desconto!"}
            </p>
          </div>

          {/* Campo de cupom */}
          <div className="max-w-md mx-auto mb-8">
            <Card className="bg-white/80 backdrop-blur border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900 flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  {t("home.haveCoupon") || "Tem um cupom?"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">
                        {couponCode.toUpperCase()} -{" "}
                        {appliedCoupon.discountType === "percentage"
                          ? `${appliedCoupon.discountValue}%`
                          : `R$ ${(appliedCoupon.discountValue / 100).toFixed(2)}`}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveCoupon}
                      className="text-green-700 hover:text-green-900"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder={t("home.couponCode") || "Código do cupom"}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="border-amber-300 focus:border-amber-500"
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      disabled={validateCouponMutation.isPending}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      {validateCouponMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        t("home.apply") || "Aplicar"
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pacotes */}
          {packagesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages?.map((pkg) => {
                const originalPrice = pkg.priceInCents;
                const finalPrice = calculateFinalPrice(originalPrice);
                const hasDiscount = finalPrice < originalPrice;

                return (
                  <Card
                    key={pkg.id}
                    className="bg-white/80 backdrop-blur border-amber-200 hover:border-amber-400 transition-all hover:shadow-lg"
                  >
                    <CardHeader>
                      <CardTitle className="text-2xl text-amber-900">
                        {pkg.name}
                      </CardTitle>
                      <CardDescription className="text-amber-700">
                        {pkg.tokenAmount} tokens
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        {hasDiscount && (
                          <p className="text-sm text-gray-500 line-through">
                            R$ {(originalPrice / 100).toFixed(2)}
                          </p>
                        )}
                        <p className="text-3xl font-bold text-amber-900">
                          R$ {(finalPrice / 100).toFixed(2)}
                        </p>
                        <p className="text-sm text-amber-700">
                          R$ {(pkg.pricePerToken / 100).toFixed(2)} por token
                        </p>
                      </div>

                      <Button
                        onClick={() => handlePurchase(pkg.id)}
                        disabled={
                          createCheckoutMutation.isPending &&
                          selectedPackage === pkg.id
                        }
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                      >
                        {createCheckoutMutation.isPending &&
                        selectedPackage === pkg.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {t("home.processing") || "Processando..."}
                          </>
                        ) : (
                          t("home.buy") || "Comprar"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="mt-12 text-center">
            <p className="text-sm text-amber-700">
              {t("home.securePayment") ||
                "Pagamento seguro processado pelo Stripe"}
            </p>
            <p className="text-xs text-amber-600 mt-2">
              {t("home.acceptedMethods") ||
                "Aceitamos cartão de crédito e Pix"}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

