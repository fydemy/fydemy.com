import { z } from "zod";
import { t, publicProcedure, protectedProcedure } from "@/lib/trpc/context";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";

export const commentsRouter = t.router({
  listByProduct: publicProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ input, ctx }) => {
      const [product, comments] = await Promise.all([
        prisma.product.findUnique({
          where: { id: input.productId },
          select: { pinnedCommentId: true },
        }),
        prisma.comment.findMany({
          where: { productId: input.productId },
          include: {
            user: { select: { id: true, name: true, username: true, image: true } },
            _count: { select: { upvotes: true, replies: true } },
            upvotes: ctx.user
              ? { where: { userId: ctx.user.id }, select: { id: true } }
              : false,
            replies: {
              include: {
                user: { select: { id: true, name: true, username: true, image: true } },
                _count: { select: { upvotes: true } },
                upvotes: ctx.user
                  ? { where: { userId: ctx.user.id }, select: { id: true } }
                  : false,
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const pinnedCommentId = product?.pinnedCommentId ?? null;

      const mapped = comments.map((c) => ({
        ...c,
        upvoteCount: c._count.upvotes,
        hasUpvoted: ctx.user ? c.upvotes.length > 0 : false,
        isPinned: c.id === pinnedCommentId,
        replies: c.replies.map((r) => ({
          ...r,
          upvoteCount: r._count.upvotes,
          hasUpvoted: ctx.user ? r.upvotes.length > 0 : false,
        })),
      }));

      return mapped.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    }),

  create: protectedProcedure
    .input(z.object({ productId: z.string(), content: z.string().min(1).max(1000) }))
    .mutation(async ({ input, ctx }) => {
      return prisma.comment.create({
        data: {
          productId: input.productId,
          userId: ctx.user.id,
          content: input.content,
        },
        include: {
          user: { select: { id: true, name: true, username: true, image: true } },
          _count: { select: { upvotes: true, replies: true } },
        },
      });
    }),

  toggleUpvote: protectedProcedure
    .input(z.object({ commentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await prisma.commentUpvote.findUnique({
        where: { commentId_userId: { commentId: input.commentId, userId: ctx.user.id } },
      });

      if (existing) {
        await prisma.commentUpvote.delete({ where: { id: existing.id } });
        return { upvoted: false };
      } else {
        await prisma.commentUpvote.create({
          data: { commentId: input.commentId, userId: ctx.user.id },
        });
        return { upvoted: true };
      }
    }),

  createReply: protectedProcedure
    .input(
      z.object({
        commentId: z.string(),
        content: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const comment = await prisma.comment.findUnique({ where: { id: input.commentId } });
      if (!comment) throw new TRPCError({ code: "NOT_FOUND" });

      return prisma.commentReply.create({
        data: {
          commentId: input.commentId,
          userId: ctx.user.id,
          content: input.content,
        },
        include: {
          user: { select: { id: true, name: true, username: true, image: true } },
          _count: { select: { upvotes: true } },
        },
      });
    }),

  toggleReplyUpvote: protectedProcedure
    .input(z.object({ replyId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await prisma.replyUpvote.findUnique({
        where: { replyId_userId: { replyId: input.replyId, userId: ctx.user.id } },
      });

      if (existing) {
        await prisma.replyUpvote.delete({ where: { id: existing.id } });
        return { upvoted: false };
      } else {
        await prisma.replyUpvote.create({
          data: { replyId: input.replyId, userId: ctx.user.id },
        });
        return { upvoted: true };
      }
    }),

  pinComment: protectedProcedure
    .input(z.object({ commentId: z.string(), productId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const product = await prisma.product.findUnique({ where: { id: input.productId } });
      if (!product) throw new TRPCError({ code: "NOT_FOUND" });
      if (product.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      const newPinnedId = product.pinnedCommentId === input.commentId ? null : input.commentId;

      await prisma.product.update({
        where: { id: input.productId },
        data: { pinnedCommentId: newPinnedId },
      });

      return { pinnedCommentId: newPinnedId };
    }),

  editComment: protectedProcedure
    .input(z.object({ commentId: z.string(), content: z.string().min(1).max(1000) }))
    .mutation(async ({ input, ctx }) => {
      const comment = await prisma.comment.findUnique({ where: { id: input.commentId } });
      if (!comment) throw new TRPCError({ code: "NOT_FOUND" });
      if (comment.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      return prisma.comment.update({
        where: { id: input.commentId },
        data: { content: input.content },
      });
    }),

  deleteComment: protectedProcedure
    .input(z.object({ commentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const comment = await prisma.comment.findUnique({ where: { id: input.commentId } });
      if (!comment) throw new TRPCError({ code: "NOT_FOUND" });
      if (comment.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      await prisma.comment.delete({ where: { id: input.commentId } });
      return { deleted: true };
    }),

  editReply: protectedProcedure
    .input(z.object({ replyId: z.string(), content: z.string().min(1).max(1000) }))
    .mutation(async ({ input, ctx }) => {
      const reply = await prisma.commentReply.findUnique({ where: { id: input.replyId } });
      if (!reply) throw new TRPCError({ code: "NOT_FOUND" });
      if (reply.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      return prisma.commentReply.update({
        where: { id: input.replyId },
        data: { content: input.content },
      });
    }),

  deleteReply: protectedProcedure
    .input(z.object({ replyId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const reply = await prisma.commentReply.findUnique({ where: { id: input.replyId } });
      if (!reply) throw new TRPCError({ code: "NOT_FOUND" });
      if (reply.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      await prisma.commentReply.delete({ where: { id: input.replyId } });
      return { deleted: true };
    }),
});
