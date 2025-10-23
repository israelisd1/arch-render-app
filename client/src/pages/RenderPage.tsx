import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

export default function RenderPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sceneType, setSceneType] = useState<"interior" | "exterior">("interior");
  const [outputFormat, setOutputFormat] = useState<"webp" | "jpg" | "png" | "avif">("jpg");
  const [prompt, setPrompt] = useState("");

  const createRender = trpc.render.create.useMutation({
    onSuccess: (data) => {
      toast.success("Renderização iniciada! Acompanhe o progresso no histórico.");
      setLocation("/history");
    },
    onError: (error) => {
      toast.error(`Erro ao iniciar renderização: ${error.message}`);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between py-4">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />}
              <h1 className="text-xl font-bold text-white">{APP_TITLE}</h1>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">Olá, {user?.name}</span>
            <Link href="/history">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                Histórico
              </Button>
            </Link>
            <Button variant="ghost" onClick={logout} className="text-white hover:bg-white/10">
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-4xl font-bold text-white">Nova Renderização</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-8 md:grid-cols-2">
              {/* Left Column - Image Upload */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Imagem 2D</CardTitle>
                  <CardDescription className="text-gray-300">
                    Faça upload da sua imagem arquitetônica
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="image" className="text-white">Selecione a imagem</Label>
                      <Input
                        id="image"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
                        onChange={handleImageChange}
                        className="mt-2 bg-white/10 border-white/20 text-white"
                        required
                      />
                    </div>
                    
                    {imagePreview && (
                      <div className="mt-4">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full rounded-lg border border-white/20"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Right Column - Parameters */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Parâmetros</CardTitle>
                  <CardDescription className="text-gray-300">
                    Configure as opções de renderização
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="sceneType" className="text-white">Tipo de Cena *</Label>
                    <Select value={sceneType} onValueChange={(value: any) => setSceneType(value)}>
                      <SelectTrigger className="mt-2 bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="interior">Interior</SelectItem>
                        <SelectItem value="exterior">Exterior</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="outputFormat" className="text-white">Formato de Saída *</Label>
                    <Select value={outputFormat} onValueChange={(value: any) => setOutputFormat(value)}>
                      <SelectTrigger className="mt-2 bg-white/10 border-white/20 text-white">
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
                    <Label htmlFor="prompt" className="text-white">Descrição / Orientações (opcional)</Label>
                    <Textarea
                      id="prompt"
                      placeholder="Ex: modern interior apartment, bright lighting, minimalist style"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      rows={4}
                    />
                    <p className="mt-2 text-sm text-gray-400">
                      Descreva o estilo e atmosfera desejados para a renderização
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
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
    </div>
  );
}

