import { z } from "zod";
import { t, publicProcedure, protectedProcedure } from "@/lib/trpc/context";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { toSlug } from "@/lib/utils";

async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = toSlug(name) || "product";

  const existing = await prisma.product.findMany({
    where: {
      slug: { startsWith: base },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { slug: true },
  });

  const takenSlugs = new Set(existing.map((p) => p.slug));

  if (!takenSlugs.has(base)) return base;

  let n = 1;
  while (takenSlugs.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export const productsRouter = t.router({
  tags: publicProcedure.query(async () => {
    return prisma.tag.findMany({ where: { isShow: true }, orderBy: { name: "asc" } });
  }),

  list: publicProcedure.query(async () => {
    const products = await prisma.product.findMany({
      include: {
        owner: { select: { id: true, name: true, username: true, image: true } },
        images: { orderBy: { order: "asc" } },
        tags: { include: { tag: true } },
        _count: { select: { upvotes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return products
      .map((p) => ({
        ...p,
        score: p._count.upvotes,
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
          tags: { include: { tag: true } },
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

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const product = await prisma.product.findFirst({
        where: { OR: [{ slug: input.slug }, { id: input.slug }] },
        include: {
          owner: { select: { id: true, name: true, username: true, image: true } },
          images: { orderBy: { order: "asc" } },
          tags: { include: { tag: true } },
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
        logoUrl: z.string().url().optional(),
        imageUrls: z.array(z.string().url()).max(3),
        tagIds: z.array(z.string()).max(5).default([]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const slug = await generateUniqueSlug(input.name);
      const product = await prisma.product.create({
        data: {
          name: input.name,
          slug,
          description: input.description,
          logoUrl: input.logoUrl,
          ownerId: ctx.user.id,
          images: {
            create: input.imageUrls.map((url, order) => ({ url, order })),
          },
          tags: {
            create: input.tagIds.map((tagId) => ({ tagId })),
          },
        },
        include: {
          owner: { select: { id: true, name: true, username: true, image: true } },
          images: true,
          tags: { include: { tag: true } },
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
        logoUrl: z.string().url().optional(),
        imageUrls: z.array(z.string().url()).max(3),
        tagIds: z.array(z.string()).max(5).default([]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const product = await prisma.product.findUnique({ where: { id: input.id } });
      if (!product) throw new TRPCError({ code: "NOT_FOUND" });
      if (product.ownerId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN" });

      const slug =
        product.name !== input.name
          ? await generateUniqueSlug(input.name, input.id)
          : (product.slug ?? (await generateUniqueSlug(input.name, input.id)));

      await prisma.productImage.deleteMany({ where: { productId: input.id } });
      await prisma.productTag.deleteMany({ where: { productId: input.id } });

      return prisma.product.update({
        where: { id: input.id },
        data: {
          name: input.name,
          slug,
          description: input.description,
          logoUrl: input.logoUrl,
          images: {
            create: input.imageUrls.map((url, order) => ({ url, order })),
          },
          tags: {
            create: input.tagIds.map((tagId) => ({ tagId })),
          },
        },
        include: {
          owner: { select: { id: true, name: true, username: true, image: true } },
          images: true,
          tags: { include: { tag: true } },
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
