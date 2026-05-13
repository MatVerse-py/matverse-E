import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { ArtifactProcessor } from "./artifact_processor";
import {
  getArtifactById,
  getAllArtifacts,
  getLedgerByArtifactId,
  getAllLedgerEntries,
  getOmegaGateDecisionByArtifactId,
  getOmegaGateStatistics,
  getOrganismMetrics,
  getActiveOmegaGateRules,
  getOmegaGateDecisionsByStatus,
  updateOmegaGateDecisionStatus,
} from "./db";
import { TRPCError } from "@trpc/server";
import { exportRouter } from "./routers/export_router";

export const appRouter = router({
  system: systemRouter,
  export: exportRouter,
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

  /**
   * Artifacts API
   */
  artifacts: router({
    /**
     * Submit an artifact for processing through the full pipeline.
     */
    submit: protectedProcedure
      .input(
        z.object({
          id: z.string().optional(),
          content: z.string().min(1, "Content cannot be empty"),
          trustScore: z.number().min(0).max(1).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const result = await ArtifactProcessor.process(
            {
              id: input.id || `artifact-${Date.now()}`,
              content: input.content,
              trustScore: input.trustScore,
            },
            ctx.user.id
          );
          return result;
        } catch (error) {
          console.error("[API] Artifact submission failed:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to process artifact",
          });
        }
      }),

    /**
     * Evaluate an artifact without processing (no ledger entry).
     */
    evaluate: publicProcedure
      .input(
        z.object({
          id: z.string().optional(),
          content: z.string().min(1),
          trustScore: z.number().min(0).max(1).optional(),
        })
      )
      .query(async ({ input }) => {
        try {
          return await ArtifactProcessor.evaluate({
            id: input.id || `artifact-eval-${Date.now()}`,
            content: input.content,
            trustScore: input.trustScore,
          });
        } catch (error) {
          console.error("[API] Artifact evaluation failed:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to evaluate artifact",
          });
        }
      }),

    /**
     * Get artifact by ID.
     */
    getById: publicProcedure
      .input(z.object({ artifactId: z.string() }))
      .query(async ({ input }) => {
        return getArtifactById(input.artifactId);
      }),

    /**
     * Get all artifacts (paginated).
     */
    getAll: publicProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        const all = await getAllArtifacts();
        return all.slice(input.offset, input.offset + input.limit);
      }),

    /**
     * Get artifact history (ledger entries for artifact).
     */
    getHistory: publicProcedure
      .input(z.object({ artifactId: z.string() }))
      .query(async ({ input }) => {
        return getLedgerByArtifactId(input.artifactId);
      }),

    /**
     * Get artifact integrity report (I-SPI, Ω-Gate decision, metrics).
     */
    getIntegrity: publicProcedure
      .input(z.object({ artifactId: z.string() }))
      .query(async ({ input }) => {
        const artifact = await getArtifactById(input.artifactId);
        const decision = await getOmegaGateDecisionByArtifactId(input.artifactId);
        const history = await getLedgerByArtifactId(input.artifactId);

        if (!artifact) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Artifact not found",
          });
        }

        return {
          artifact,
          decision,
          history,
        };
      }),
  }),

  /**
   * Ledger API (immutable, append-only)
   */
  ledger: router({
    /**
     * Get all ledger entries.
     */
    getAll: publicProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        const all = await getAllLedgerEntries();
        return all.slice(input.offset, input.offset + input.limit);
      }),

    /**
     * Get ledger entry count.
     */
    getCount: publicProcedure.query(async () => {
      const all = await getAllLedgerEntries();
      return { count: all.length };
    }),
  }),

  /**
   * Ω-Gate API
   */
  omegaGate: router({
    /**
     * Get Ω-Gate statistics (PASS/HOLD/REVIEW/BLOCK counts).
     */
    getStatistics: publicProcedure.query(async () => {
      return getOmegaGateStatistics();
    }),

    /**
     * Get active Ω-Gate rules.
     */
    getRules: publicProcedure.query(async () => {
      return getActiveOmegaGateRules();
    }),

    /**
     * Get pending decisions (HOLD/REVIEW queue).
     */
    getQueue: publicProcedure
      .input(
        z.object({
          status: z.enum(["PENDING", "APPROVED", "BLOCKED", "RELEASED"]).default("PENDING"),
        })
      )
      .query(async ({ input }) => {
        return getOmegaGateDecisionsByStatus(input.status);
      }),

    /**
     * Admin: Approve a decision (owner only).
     */
    approve: protectedProcedure
      .input(z.object({ decisionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Check if user is admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can approve decisions",
          });
        }

        try {
          await updateOmegaGateDecisionStatus(input.decisionId, "APPROVED", ctx.user.id);
          return { success: true };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to approve decision",
          });
        }
      }),

    /**
     * Admin: Block a decision (owner only).
     */
    block: protectedProcedure
      .input(z.object({ decisionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Check if user is admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can block decisions",
          });
        }

        try {
          await updateOmegaGateDecisionStatus(input.decisionId, "BLOCKED", ctx.user.id);
          return { success: true };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to block decision",
          });
        }
      }),

    /**
     * Admin: Release a held decision (owner only).
     */
    release: protectedProcedure
      .input(z.object({ decisionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Check if user is admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can release decisions",
          });
        }

        try {
          await updateOmegaGateDecisionStatus(input.decisionId, "RELEASED", ctx.user.id);
          return { success: true };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to release decision",
          });
        }
      }),
  }),

  /**
   * System Status API
   */
  organism: router({
    /**
     * Get organism metrics (Ψ, Ω, Θ, total artifacts, ledger size).
     */
    getStatus: publicProcedure.query(async () => {
      const metrics = await getOrganismMetrics();
      const omegaStats = await getOmegaGateStatistics();

      return {
        ...metrics,
        omegaGateStats: omegaStats,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
