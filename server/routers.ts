import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { callArchitectureRenderingAPI } from "./architectureApi";
import { addTokens, createRender, deductTokens, getActiveTokenPackages, getRenderById, getUserTokenTransactions, getUserRenders, updateRenderStatus, getDb } from "./db";
import { renders } from "../drizzle/schema";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  render: router({
    /**
     * Cria uma nova renderização
     */
    create: protectedProcedure
      .input(
        z.object({
          sceneType: z.enum(["interior", "exterior"]),
          outputFormat: z.enum(["webp", "jpg", "png", "avif"]),
          imageBase64: z.string(),
          prompt: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // 1. Verificar saldo de tokens
        if (ctx.user.tokenBalance < 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Saldo de tokens insuficiente. Compre mais tokens para continuar.",
          });
        }

        // 2. Fazer upload da imagem original para S3
        const imageBuffer = Buffer.from(input.imageBase64.split(",")[1], "base64");
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const originalKey = `renders/${ctx.user.id}/original-${timestamp}-${randomSuffix}.${input.outputFormat}`;
        
        const { url: originalImageUrl } = await storagePut(
          originalKey,
          imageBuffer,
          `image/${input.outputFormat}`
        );

        // 3. Criar registro no banco
        const result = await createRender({
          userId: ctx.user.id,
          originalImageUrl,
          sceneType: input.sceneType,
          outputFormat: input.outputFormat,
          prompt: input.prompt,
          status: "processing",
        });

        const renderId = Number(result[0].insertId);

        // 4. Deduzir 1 token do saldo
        try {
          await deductTokens(ctx.user.id, 1, renderId, `Renderização #${renderId}`);
          console.log(`[Render ${renderId}] 1 token deduzido. Novo saldo: ${ctx.user.tokenBalance - 1}`);
        } catch (error: any) {
          console.error(`[Render ${renderId}] Erro ao deduzir token:`, error);
          await updateRenderStatus(renderId, "failed", {
            errorMessage: "Erro ao processar pagamento de token",
            completedAt: new Date(),
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao processar pagamento de token",
          });
        }

        // 5. Chamar API de renderização em background
        (async () => {
          try {
            console.log(`[Render ${renderId}] Iniciando chamada à API...`);
            const apiResponse = await callArchitectureRenderingAPI({
              sceneType: input.sceneType,
              outputFormat: input.outputFormat,
              image: originalImageUrl,
              prompt: input.prompt,
            });

            console.log(`[Render ${renderId}] Resposta da API:`, JSON.stringify(apiResponse));

            if (apiResponse.output) {
              console.log(`[Render ${renderId}] Renderização concluída com sucesso`);
              await updateRenderStatus(renderId, "completed", {
                renderedImageUrl: apiResponse.output,
                completedAt: new Date(),
              });
            } else {
              const errorMsg = apiResponse.error || apiResponse.message || "API não retornou imagem renderizada";
              console.error(`[Render ${renderId}] Falha: ${errorMsg}`);
              await updateRenderStatus(renderId, "failed", {
                errorMessage: errorMsg,
                completedAt: new Date(),
              });
            }
          } catch (error: any) {
            console.error(`[Render ${renderId}] Erro na requisição:`, error);
            await updateRenderStatus(renderId, "failed", {
              errorMessage: error.message || "Erro desconhecido ao processar renderização",
              completedAt: new Date(),
            });
          }
        })();

        return { id: renderId };
      }),

    /**
     * Lista renderizações do usuário
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserRenders(ctx.user.id);
    }),

    /**
     * Busca uma renderização por ID
     */
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const render = await getRenderById(input.id);
        
        if (!render) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Renderização não encontrada",
          });
        }

        if (render.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Acesso negado",
          });
        }

        return render;
      }),

    /**
     * Refinar uma renderização existente com novo prompt
     */
    refine: protectedProcedure
      .input(
        z.object({
          parentRenderId: z.number(),
          prompt: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // 1. Verificar saldo de tokens
        if (ctx.user.tokenBalance < 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Saldo de tokens insuficiente. Compre mais tokens para continuar.",
          });
        }

        // 2. Buscar renderização original
        const parentRender = await getRenderById(input.parentRenderId);
        
        if (!parentRender) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Renderização original não encontrada",
          });
        }

        if (parentRender.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Acesso negado",
          });
        }

        if (parentRender.status !== "completed" || !parentRender.renderedImageUrl) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Apenas renderizações concluídas podem ser refinadas",
          });
        }

        // 3. Criar nova renderização usando a imagem renderizada como base
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(renders).values({
          userId: ctx.user.id,
          originalImageUrl: parentRender.renderedImageUrl, // Usar imagem renderizada como base
          sceneType: parentRender.sceneType,
          outputFormat: parentRender.outputFormat,
          prompt: input.prompt,
          parentRenderId: input.parentRenderId, // Rastrear origem
          status: "processing",
        });

        const renderId = Number(result[0].insertId);

        // 4. Deduzir 1 token do saldo
        try {
          await deductTokens(ctx.user.id, 1, renderId, `Refinamento #${renderId}`);
          console.log(`[Refine ${renderId}] 1 token deduzido. Novo saldo: ${ctx.user.tokenBalance - 1}`);
        } catch (error: any) {
          console.error(`[Refine ${renderId}] Erro ao deduzir token:`, error);
          await updateRenderStatus(renderId, "failed", {
            errorMessage: "Erro ao processar pagamento de token",
            completedAt: new Date(),
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao processar pagamento de token",
          });
        }

        // 5. Chamar API de renderização em background
        (async () => {
          try {
            console.log(`[Refine ${renderId}] Iniciando refinamento da renderização ${input.parentRenderId}...`);
            const apiResponse = await callArchitectureRenderingAPI({
              sceneType: parentRender.sceneType,
              outputFormat: parentRender.outputFormat as "webp" | "jpg" | "png" | "avif",
              image: parentRender.renderedImageUrl!,
              prompt: input.prompt,
            });

            console.log(`[Refine ${renderId}] Resposta da API:`, JSON.stringify(apiResponse));

            if (apiResponse.output) {
              console.log(`[Refine ${renderId}] Refinamento concluído com sucesso`);
              await updateRenderStatus(renderId, "completed", {
                renderedImageUrl: apiResponse.output,
                completedAt: new Date(),
              });
            } else {
              const errorMsg = apiResponse.error || apiResponse.message || "API não retornou imagem renderizada";
              console.error(`[Refine ${renderId}] Falha: ${errorMsg}`);
              await updateRenderStatus(renderId, "failed", {
                errorMessage: errorMsg,
                completedAt: new Date(),
              });
            }
          } catch (error: any) {
            console.error(`[Refine ${renderId}] Erro na requisição:`, error);
            await updateRenderStatus(renderId, "failed", {
              errorMessage: error.message || "Erro desconhecido ao processar refinamento",
              completedAt: new Date(),
            });
          }
        })();

        return { id: renderId };
      }),
  }),

  /**
   * Rotas relacionadas a tokens
   */
  tokens: router({
    /**
     * Lista pacotes de tokens disponíveis
     */
    listPackages: publicProcedure.query(async () => {
      return await getActiveTokenPackages();
    }),

    /**
     * Compra um pacote de tokens (mock - sem pagamento real)
     */
    purchase: protectedProcedure
      .input(z.object({ packageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const packages = await getActiveTokenPackages();
        const pkg = packages.find((p) => p.id === input.packageId);

        if (!pkg) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Pacote não encontrado",
          });
        }

        // Adicionar tokens ao saldo
        const newBalance = await addTokens(
          ctx.user.id,
          pkg.tokenAmount,
          pkg.id,
          pkg.priceInCents,
          `Compra de ${pkg.name} (${pkg.tokenAmount} tokens)`
        );

        console.log(`[Token Purchase] Usuário ${ctx.user.id} comprou ${pkg.tokenAmount} tokens. Novo saldo: ${newBalance}`);

        return { success: true, newBalance, tokensAdded: pkg.tokenAmount };
      }),

    /**
     * Busca histórico de transações do usuário
     */
    transactions: protectedProcedure.query(async ({ ctx }) => {
      return await getUserTokenTransactions(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
