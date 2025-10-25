import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Loader2, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

export default function HistoryPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { data: renders, isLoading } = trpc.render.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 5000, // Atualiza a cada 5 segundos para ver progresso
  });

  const [refineDialogOpen, setRefineDialogOpen] = useState(false);
  const [selectedRenderId, setSelectedRenderId] = useState<number | null>(null);
  const [refinePrompt, setRefinePrompt] = useState("");

  const utils = trpc.useUtils();
  const refineMutation = trpc.render.refine.useMutation({
    onSuccess: () => {
      toast.success("Refinamento iniciado! Acompanhe o progresso no histórico.");
      setRefineDialogOpen(false);
      setRefinePrompt("");
      setSelectedRenderId(null);
      utils.render.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao iniciar refinamento: ${error.message}`);
    },
  });

  const handleRefine = () => {
    if (selectedRenderId) {
      refineMutation.mutate({
        parentRenderId: selectedRenderId,
        prompt: refinePrompt || undefined,
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Autenticação Necessária</CardTitle>
            <CardDescription className="text-gray-300">
              Você precisa estar autenticado para ver o histórico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Fazer Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      processing: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      completed: "bg-green-500/20 text-green-300 border-green-500/30",
      failed: "bg-red-500/20 text-red-300 border-red-500/30",
    };
    
    const labels = {
      pending: "Pendente",
      processing: "Processando",
      completed: "Concluído",
      failed: "Falhou",
    };

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border ${styles[status as keyof typeof styles]}`}>
        {status === "processing" && <Loader2 className="h-3 w-3 animate-spin" />}
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-4xl font-bold text-amber-900">Histórico de Renderizações</h2>
            <Link href="/render">
              <Button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
                + Nova Renderização
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          ) : !renders || renders.length === 0 ? (
            <Card className="bg-white/90 border-amber-200">
              <CardContent className="py-20 text-center">
                <p className="text-xl text-amber-800 mb-4">Nenhuma renderização encontrada</p>
                <Link href="/render">
                  <Button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
                    Criar sua primeira renderização
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {renders.map((render) => (
                <Card key={render.id} className="bg-white/90 border-amber-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-black/20 relative">
                    {render.status === "completed" && render.renderedImageUrl ? (
                      <img
                        src={render.renderedImageUrl}
                        alt="Renderização"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={render.originalImageUrl}
                        alt="Original"
                        className="w-full h-full object-cover opacity-50"
                      />
                    )}
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(render.status)}
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-amber-900 text-sm">
                      {render.sceneType === "interior" ? "Interior" : "Exterior"} • {render.outputFormat.toUpperCase()}
                    </CardTitle>
                    <CardDescription className="text-amber-700 text-xs">
                      {new Date(render.createdAt).toLocaleString("pt-BR")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {render.prompt && (
                      <p className="text-sm text-amber-800 mb-3 line-clamp-2">{render.prompt}</p>
                    )}
                    {render.status === "completed" && render.renderedImageUrl && (
                      <div className="space-y-2">
                        <Button asChild variant="outline" className="w-full border-amber-300 text-amber-900 hover:bg-amber-50">
                          <a href={render.renderedImageUrl} target="_blank" rel="noopener noreferrer">
                            Baixar Imagem
                          </a>
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedRenderId(render.id);
                            setRefinePrompt("");
                            setRefineDialogOpen(true);
                          }}
                          variant="outline"
                          className="w-full border-amber-400 text-amber-700 hover:bg-amber-50"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Refinar
                        </Button>
                      </div>
                    )}
                    {render.status === "failed" && render.errorMessage && (
                      <p className="text-sm text-red-600 bg-red-50 p-2 rounded">Erro: {render.errorMessage}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Dialog de Refinamento */}
      <Dialog open={refineDialogOpen} onOpenChange={setRefineDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>Refinar Renderização</DialogTitle>
            <DialogDescription className="text-gray-400">
              Adicione um prompt para ajustar a renderização existente. A imagem renderizada será usada como base.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="refine-prompt" className="text-white">
                Prompt de Refinamento (opcional)
              </Label>
              <Textarea
                id="refine-prompt"
                placeholder="Ex: add more natural lighting, warmer tones, modern furniture"
                value={refinePrompt}
                onChange={(e) => setRefinePrompt(e.target.value)}
                className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                rows={4}
              />
              <p className="mt-2 text-sm text-gray-400">
                Descreva os ajustes que deseja fazer na renderização
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRefineDialogOpen(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRefine}
              disabled={refineMutation.isPending}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
            >
              {refineMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Iniciar Refinamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

