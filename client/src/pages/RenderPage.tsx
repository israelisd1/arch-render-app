import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Coins } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function RenderPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sceneType, setSceneType] = useState<"interior" | "exterior">("interior");
  const [outputFormat, setOutputFormat] = useState<"webp" | "jpg" | "png" | "avif">("jpg");
  const [prompt, setPrompt] = useState("");
  const [showInsufficientTokensDialog, setShowInsufficientTokensDialog] = useState(false);

  const createRender = trpc.render.create.useMutation({
    onSuccess: (data) => {
      toast.success("Renderização iniciada! Acompanhe o progresso no histórico.");
      setLocation("/history");
    },
    onError: (error) => {
      if (error.message.includes("Saldo de tokens insuficiente")) {
        setShowInsufficientTokensDialog(true);
      } else {
        toast.error(`Erro ao iniciar renderização: ${error.message}`);
      }
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile || !imagePreview) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    createRender.mutate({
      sceneType,
      outputFormat,
      imageBase64: imagePreview,
      prompt: prompt || undefined,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Autenticação Necessária</CardTitle>
            <CardDescription className="text-gray-300">
              Você precisa estar autenticado para usar esta funcionalidade.
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-4xl font-bold text-amber-900">Nova Renderização</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-8 md:grid-cols-2">
              {/* Left Column - Image Upload */}
              <Card className="bg-white/90 backdrop-blur border-amber-200">
                <CardHeader>
                  <CardTitle className="text-amber-900">Imagem 2D</CardTitle>
                  <CardDescription className="text-amber-700">
                    Faça upload da sua imagem arquitetônica
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="image" className="text-amber-900 font-semibold">Selecione a imagem</Label>
                      <Input
                        id="image"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
                        onChange={handleImageChange}
                        className="mt-2 bg-white border-amber-300 text-amber-900"
                        required
                      />
                    </div>
                    
                    {imagePreview && (
                      <div className="mt-4">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full rounded-lg border-2 border-amber-300"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Right Column - Parameters */}
              <Card className="bg-white/90 backdrop-blur border-amber-200">
                <CardHeader>
                  <CardTitle className="text-amber-900">Parâmetros</CardTitle>
                  <CardDescription className="text-amber-700">
                    Configure as opções de renderização
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="sceneType" className="text-amber-900 font-semibold">Tipo de Cena *</Label>
                    <Select value={sceneType} onValueChange={(value: any) => setSceneType(value)}>
                      <SelectTrigger className="mt-2 bg-white border-amber-300 text-amber-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="interior">Interior</SelectItem>
                        <SelectItem value="exterior">Exterior</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="outputFormat" className="text-amber-900 font-semibold">Formato de Saída *</Label>
                    <Select value={outputFormat} onValueChange={(value: any) => setOutputFormat(value)}>
                      <SelectTrigger className="mt-2 bg-white border-amber-300 text-amber-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="jpg">JPG</SelectItem>
                        <SelectItem value="png">PNG</SelectItem>
                        <SelectItem value="webp">WebP</SelectItem>
                        <SelectItem value="avif">AVIF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="prompt" className="text-amber-900 font-semibold">Descrição / Orientações (opcional)</Label>
                    <Textarea
                      id="prompt"
                      placeholder="Ex: modern interior apartment, bright lighting, minimalist style"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="mt-2 bg-white border-amber-300 text-amber-900 placeholder:text-amber-500"
                      rows={4}
                    />
                    <p className="mt-2 text-sm text-amber-700">
                      Descreva o estilo e atmosfera desejados para a renderização
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                    disabled={createRender.isPending || !imageFile}
                  >
                    {createRender.isPending ? "Processando..." : "Iniciar Renderização"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </form>
        </div>
      </main>

      {/* Dialog de Saldo Insuficiente */}
      <Dialog open={showInsufficientTokensDialog} onOpenChange={setShowInsufficientTokensDialog}>
        <DialogContent className="bg-slate-900 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-6 w-6 text-yellow-400" />
              Saldo de Tokens Insuficiente
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Você precisa de pelo menos 1 token para criar uma renderização.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-white mb-4">
              Saldo atual: <strong>{user?.tokenBalance || 0} tokens</strong>
            </p>
            <p className="text-gray-300">
              Cada renderização consome 1 token. Compre mais tokens para continuar criando renderizações incríveis!
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInsufficientTokensDialog(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              asChild
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
            >
              <Link href="/tokens">
                <a>Comprar Tokens</a>
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

