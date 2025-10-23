import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { callArchitectureRenderingAPI } from "./architectureApi";
import { createRender, getRenderById, getUserRenders, updateRenderStatus } from "./db";
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
        // 1. Fazer upload da imagem original para S3
        const imageBuffer = Buffer.from(input.imageBase64.split(",")[1], "base64");
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const originalKey = `renders/${ctx.user.id}/original-${timestamp}-${randomSuffix}.${input.outputFormat}`;
        
        const { url: originalImageUrl } = await storagePut(
          originalKey,
          imageBuffer,
          `image/${input.outputFormat}`
        );

        // 2. Criar registro no banco
        const result = await createRender({
          userId: ctx.user.id,
          originalImageUrl,
          sceneType: input.sceneType,
          outputFormat: input.outputFormat,
          prompt: input.prompt,
          status: "processing",
        });

        const renderId = Number(result[0].insertId);

        // 3. Chamar API de renderização em background
        (async () => {
          try {
            const apiResponse = await callArchitectureRenderingAPI({
              sceneType: input.sceneType,
              outputFormat: input.outputFormat,
              image: originalImageUrl,
              prompt: input.prompt,
            });

            if (apiResponse.url) {
              await updateRenderStatus(renderId, "completed", {
                renderedImageUrl: apiResponse.url,
                completedAt: new Date(),
              });
            } else {
              await updateRenderStatus(renderId, "failed", {
                errorMessage: apiResponse.error || "Unknown error",
                completedAt: new Date(),
              });
            }
          } catch (error: any) {
            await updateRenderStatus(renderId, "failed", {
              errorMessage: error.message,
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
  }),
});

export type AppRouter = typeof appRouter;
