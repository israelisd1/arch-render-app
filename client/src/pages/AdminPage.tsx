import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Users, Coins, TrendingUp, FileText, DollarSign } from "lucide-react";
import Header from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery(undefined, {
    enabled: isAuthenticated && user?.email === 'israelisd@gmail.com',
  });

  const { data: users, isLoading: usersLoading } = trpc.admin.users.useQuery(undefined, {
    enabled: isAuthenticated && user?.email === 'israelisd@gmail.com',
  });

  // Verificar se o usuário tem permissão
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900">Autenticação Necessária</CardTitle>
            <CardDescription className="text-amber-700">
              Você precisa estar autenticado para acessar esta página.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-gradient-to-r from-amber-600 to-orange-600">
              <a href={getLoginUrl()}>Fazer Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.email !== 'israelisd@gmail.com') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900">Acesso Negado</CardTitle>
            <CardDescription className="text-amber-700">
              Você não tem permissão para acessar o painel administrativo.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-amber-900 mb-2">Painel Administrativo</h1>
          <p className="text-amber-700">Visão geral do sistema e gerenciamento de usuários</p>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card className="bg-white/90 backdrop-blur border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-900">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900">
                {statsLoading ? "..." : stats?.totalUsers || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-900">Tokens Comprados</CardTitle>
              <Coins className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900">
                {statsLoading ? "..." : stats?.totalTokensPurchased || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-900">Tokens Utilizados</CardTitle>
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900">
                {statsLoading ? "..." : stats?.totalTokensUsed || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-900">Renderizações</CardTitle>
              <FileText className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900">
                {statsLoading ? "..." : stats?.totalRenders || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-900">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900">
                {statsLoading ? "..." : `R$ ${((stats?.totalRevenue || 0) / 100).toFixed(2)}`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Usuários */}
        <Card className="bg-white/90 backdrop-blur border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900">Usuários Cadastrados</CardTitle>
            <CardDescription className="text-amber-700">
              Lista completa de usuários e suas estatísticas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="text-center py-8 text-amber-700">Carregando...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-amber-900">ID</TableHead>
                      <TableHead className="text-amber-900">Nome</TableHead>
                      <TableHead className="text-amber-900">E-mail</TableHead>
                      <TableHead className="text-amber-900">Cadastro</TableHead>
                      <TableHead className="text-amber-900">Último Login</TableHead>
                      <TableHead className="text-amber-900 text-right">Saldo</TableHead>
                      <TableHead className="text-amber-900 text-right">Comprados</TableHead>
                      <TableHead className="text-amber-900 text-right">Usados</TableHead>
                      <TableHead className="text-amber-900 text-right">Renderizações</TableHead>
                      <TableHead className="text-amber-900 text-right">Total Gasto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="text-amber-900 font-medium">{user.id}</TableCell>
                        <TableCell className="text-amber-900">{user.name || "-"}</TableCell>
                        <TableCell className="text-amber-900">{user.email || "-"}</TableCell>
                        <TableCell className="text-amber-900">
                          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-amber-900">
                          {new Date(user.lastSignedIn).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-amber-900 text-right font-semibold">
                          {user.tokenBalance}
                        </TableCell>
                        <TableCell className="text-amber-900 text-right">
                          {user.totalTokensPurchased}
                        </TableCell>
                        <TableCell className="text-amber-900 text-right">
                          {user.tokensUsed}
                        </TableCell>
                        <TableCell className="text-amber-900 text-right">
                          {user.totalRendersCount}
                        </TableCell>
                        <TableCell className="text-amber-900 text-right font-semibold">
                          R$ {(user.totalSpent / 100).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

