import { z } from "zod";
import { t, publicProcedure, protectedProcedure } from "@/lib/trpc/context";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";

export const productsRouter = t.router({
  list: publicProcedure.query(async () => {
    const products = await prisma.product.findMany({
      include: {
        owner: { select: { id: true, name: true, username: true, image: true } },
        images: { orderBy: { order: "asc" } },
        _count: { select: { upvotes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return products
      .map((p) => ({
        ...p,
        score: p._count.upvotes + p._count.comments,
      }))
      .sort((a, b) => b.score - a.score);
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const product = await prisma.product.findUnique({
        where: { id: input.id },
        include: {
          owner: { select: { id: true, name: true, username: true, image: true } },
          images: { orderBy: { order: "asc" } },
          _count: { select: { upvotes: true, comments: true } },
          upvotes: ctx.user
            ? { where: { userId: ctx.user.id }, select: { id: true } }
            : false,
        },
      });

      if (!product) throw new TRPCError({ code: "NOT_FOUND" });

      return {
        ...product,
        upvoteCount: product._count.upvotes,
        commentCount: product._count.comments,
        hasUpvoted: ctx.user ? product.upvotes.length > 0 : false,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().min(1).max(500),
        logoUrl: z.string().url(),
        imageUrls: z.array(z.string().url()).max(3),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const product = await prisma.product.create({
        data: {
          name: input.name,
          description: input.description,
          logoUrl: input.logoUrl,
          ownerId: ctx.user.id,
          images: {
            create: input.imageUrls.map((url, order) => ({ url, order })),
          },
        },
        include: {
          owner: { select: { id: true, name: true, username: true, image: true } },
          images: true,
          _count: { select: { upvotes: true, comments: true } },
        },
      });
      return product;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100),
        description: z.string().min(1).max(500),
        logoUrl: z.string().url(),
        imageUrls: z.array(z.string().url()).max(3),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const product = await prisma.product.findUnique({ where: { id: input.id } });
      if (!product) throw new TRPCError({ code: "NOT_FOUND" });
      if (product.ownerId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN" });

      await prisma.productImage.deleteMany({ where: { productId: input.id } });

      return prisma.product.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          logoUrl: input.logoUrl,
          images: {
            create: input.imageUrls.map((url, order) => ({ url, order })),
          },
        },
        include: {
          owner: { select: { id: true, name: true, username: true, image: true } },
          images: true,
          _count: { select: { upvotes: true, comments: true } },
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const product = await prisma.product.findUnique({ where: { id: input.id } });
      if (!product) throw new TRPCError({ code: "NOT_FOUND" });
      if (product.ownerId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN" });

      await prisma.product.delete({ where: { id: input.id } });
      return { success: true };
    }),

  toggleUpvote: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await prisma.productUpvote.findUnique({
        where: { productId_userId: { productId: input.productId, userId: ctx.user.id } },
      });

      if (existing) {
        await prisma.productUpvote.delete({ where: { id: existing.id } });
        return { upvoted: false };
      } else {
        await prisma.productUpvote.create({
          data: { productId: input.productId, userId: ctx.user.id },
        });
        return { upvoted: true };
      }
    }),
});
