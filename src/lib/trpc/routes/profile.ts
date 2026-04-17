import { z } from "zod";
import { t, publicProcedure, protectedProcedure } from "@/lib/trpc/context";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";

export const profileRouter = t.router({
  getByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { username: input.username },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          bio: true,
          createdAt: true,
          products: {
            include: {
              images: { orderBy: { order: "asc" } },
              _count: { select: { upvotes: true, comments: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return user;
    }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        username: z.string().min(2).max(30).regex(/^[a-z0-9_]+$/),
        bio: z.string().max(200).optional(),
        image: z.string().url().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await prisma.user.findFirst({
        where: { username: input.username, NOT: { id: ctx.user.id } },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already taken",
        });
      }

      return prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          name: input.name,
          username: input.username,
          bio: input.bio ?? null,
          image: input.image || undefined,
        },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          bio: true,
        },
      });
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        email: true,
      },
    });
  }),
});
