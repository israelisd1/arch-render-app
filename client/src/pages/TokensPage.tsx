import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Check, Coins, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TokensPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { data: packages, isLoading: packagesLoading } = trpc.tokens.listPackages.useQuery();
  const utils = trpc.useUtils();

  const purchaseMutation = trpc.tokens.purchase.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.tokensAdded} tokens adicionados! Novo saldo: ${data.newBalance} tokens`);
      utils.auth.me.invalidate(); // Atualizar saldo no header
    },
    onError: (error) => {
      toast.error(`Erro ao comprar tokens: ${error.message}`);
    },
  });

  const handlePurchase = (packageId: number) => {
    purchaseMutation.mutate({ packageId });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white max-w-md">
          <CardHeader>
            <CardTitle>Autenticação Necessária</CardTitle>
            <CardDescription className="text-gray-300">
              Faça login para comprar tokens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <a href={getLoginUrl()}>Fazer Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              Compre <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Tokens</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Cada renderização consome 1 token. Escolha o pacote ideal para suas necessidades.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 bg-white/10 px-6 py-3 rounded-full">
              <Coins className="h-6 w-6 text-yellow-400" />
              <span className="text-white text-lg">Saldo atual: <strong>{user?.tokenBalance || 0} tokens</strong></span>
            </div>
          </div>

          {packagesLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 text-purple-400 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages?.map((pkg, index) => {
                const pricePerToken = pkg.pricePerToken / 100;
                const totalPrice = pkg.priceInCents / 100;
                const discount = index === 0 ? 0 : Math.round((1 - pricePerToken / 10) * 100);
                const isPopular = index === 2; // Pacote Popular

                return (
                  <Card
                    key={pkg.id}
                    className={`relative bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/15 transition-all ${
                      isPopular ? "ring-2 ring-purple-500 scale-105" : ""
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-1 rounded-full text-sm font-semibold">
                        Mais Popular
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                      <CardDescription className="text-gray-300">
                        <span className="text-4xl font-bold text-white">{pkg.tokenAmount}</span> tokens
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-3xl font-bold">R$ {totalPrice.toFixed(2)}</span>
                          {discount > 0 && (
                            <span className="text-green-400 text-sm font-semibold">
                              {discount}% OFF
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          R$ {pricePerToken.toFixed(2)} por token
                        </p>
                      </div>

                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm text-gray-300">
                          <Check className="h-4 w-4 text-green-400" />
                          {pkg.tokenAmount} renderizações
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-300">
                          <Check className="h-4 w-4 text-green-400" />
                          Alta qualidade
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-300">
                          <Check className="h-4 w-4 text-green-400" />
                          Sem expiração
                        </li>
                      </ul>

                      <Button
                        onClick={() => handlePurchase(pkg.id)}
                        disabled={purchaseMutation.isPending}
                        className={`w-full ${
                          isPopular
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            : "bg-white/20 hover:bg-white/30"
                        } text-white`}
                      >
                        {purchaseMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          "Comprar Agora"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="mt-12 text-center">
            <p className="text-gray-400 text-sm">
              💡 <strong>Nota:</strong> Este é um sistema de demonstração. Nenhum pagamento real é processado.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

