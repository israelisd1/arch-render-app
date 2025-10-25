import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Loader2, Sliders } from "lucide-react";
import Header from "@/components/Header";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { toast } from "sonner";

export default function HistoryPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const { data: renders, isLoading } = trpc.render.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 5000, // Atualiza a cada 5 segundos para ver progresso
  });

  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedRenderId, setSelectedRenderId] = useState<number | null>(null);
  const [selectedRenderUrl, setSelectedRenderUrl] = useState<string>("");
  
  // Controles de ajuste
  const [saturation, setSaturation] = useState(0); // -100 a +100
  const [brightness, setBrightness] = useState(0); // -50 a +50
  const [contrast, setContrast] = useState(0); // -50 a +50
  const [lighting, setLighting] = useState(0); // -30 a +30

  const utils = trpc.useUtils();
  const refineMutation = trpc.render.refine.useMutation({
    onSuccess: () => {
      toast.success(t("adjust.success"));
      setAdjustDialogOpen(false);
      resetAdjustments();
      setSelectedRenderId(null);
      setSelectedRenderUrl("");
      utils.render.list.invalidate();
    },
    onError: (error) => {
      toast.error(`${t("adjust.error")}: ${error.message}`);
    },
  });

  const resetAdjustments = () => {
    setSaturation(0);
    setBrightness(0);
    setContrast(0);
    setLighting(0);
  };

  const handleApplyAdjustments = () => {
    if (selectedRenderId) {
      // Criar prompt descritivo baseado nos ajustes
      const adjustments = [];
      if (saturation !== 0) adjustments.push(`saturação ${saturation > 0 ? '+' : ''}${saturation}%`);
      if (brightness !== 0) adjustments.push(`brilho ${brightness > 0 ? '+' : ''}${brightness}%`);
      if (contrast !== 0) adjustments.push(`contraste ${contrast > 0 ? '+' : ''}${contrast}%`);
      if (lighting !== 0) adjustments.push(`iluminação ${lighting > 0 ? '+' : ''}${lighting}%`);
      
      const prompt = adjustments.length > 0 
        ? `Ajustar: ${adjustments.join(', ')}`
        : undefined;

      refineMutation.mutate({
        parentRenderId: selectedRenderId,
        prompt,
        saturation,
        brightness,
        contrast,
        lighting,
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 bg-white/90 border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900">Acesso Restrito</CardTitle>
            <CardDescription className="text-amber-700">Faça login para ver seu histórico</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
              <a href={getLoginUrl()}>Fazer Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      processing: "bg-blue-100 text-blue-800 border-blue-300",
      completed: "bg-green-100 text-green-800 border-green-300",
      failed: "bg-red-100 text-red-800 border-red-300",
    };

    const labels = {
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

  // Estilo CSS inline para preview com filtros
  const getPreviewStyle = () => ({
    filter: `
      saturate(${100 + saturation}%)
      brightness(${100 + brightness}%)
      contrast(${100 + contrast}%)
      ${lighting !== 0 ? `brightness(${100 + lighting}%)` : ''}
    `.trim(),
  });

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
                            setSelectedRenderUrl(render.renderedImageUrl || "");
                            resetAdjustments();
                            setAdjustDialogOpen(true);
                          }}
                          variant="outline"
                          className="w-full border-amber-400 text-amber-700 hover:bg-amber-50"
                        >
                          <Sliders className="h-4 w-4 mr-2" />
                          {t("adjust.title")}
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

      {/* Dialog de Ajustes */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="bg-white border-amber-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-amber-900">{t("adjust.title")}</DialogTitle>
            <DialogDescription className="text-amber-700">
              {t("adjust.description")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Preview */}
            <div className="aspect-video bg-black/5 rounded-lg overflow-hidden border border-amber-200">
              {selectedRenderUrl && (
                <img
                  src={selectedRenderUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  style={getPreviewStyle()}
                />
              )}
            </div>

            {/* Controles */}
            <div className="space-y-4">
              {/* Saturação */}
              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-amber-900">{t("adjust.saturation")}</Label>
                  <span className="text-sm text-amber-700 font-mono">{saturation > 0 ? '+' : ''}{saturation}%</span>
                </div>
                <Slider
                  value={[saturation]}
                  onValueChange={(v) => setSaturation(v[0])}
                  min={-100}
                  max={100}
                  step={5}
                  className="cursor-pointer"
                />
              </div>

              {/* Brilho */}
              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-amber-900">{t("adjust.brightness")}</Label>
                  <span className="text-sm text-amber-700 font-mono">{brightness > 0 ? '+' : ''}{brightness}%</span>
                </div>
                <Slider
                  value={[brightness]}
                  onValueChange={(v) => setBrightness(v[0])}
                  min={-50}
                  max={50}
                  step={5}
                  className="cursor-pointer"
                />
              </div>

              {/* Contraste */}
              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-amber-900">{t("adjust.contrast")}</Label>
                  <span className="text-sm text-amber-700 font-mono">{contrast > 0 ? '+' : ''}{contrast}%</span>
                </div>
                <Slider
                  value={[contrast]}
                  onValueChange={(v) => setContrast(v[0])}
                  min={-50}
                  max={50}
                  step={5}
                  className="cursor-pointer"
                />
              </div>

              {/* Iluminação */}
              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-amber-900">{t("adjust.lighting")}</Label>
                  <span className="text-sm text-amber-700 font-mono">{lighting > 0 ? '+' : ''}{lighting}%</span>
                </div>
                <Slider
                  value={[lighting]}
                  onValueChange={(v) => setLighting(v[0])}
                  min={-30}
                  max={30}
                  step={5}
                  className="cursor-pointer"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAdjustDialogOpen(false);
                resetAdjustments();
              }}
              className="border-amber-300 text-amber-900 hover:bg-amber-50"
            >
              {t("adjust.cancel")}
            </Button>
            <Button
              variant="outline"
              onClick={resetAdjustments}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              {t("adjust.reset")}
            </Button>
            <Button
              onClick={handleApplyAdjustments}
              disabled={refineMutation.isPending}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
            >
              {refineMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("adjust.applying")}
                </>
              ) : (
                t("adjust.apply")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

