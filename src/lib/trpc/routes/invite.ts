import { z } from "zod";
import { t } from "../trpc";
import { reviewerProcedure } from "../context";
import { USER_ROLES, roleLabel, type UserRole } from "@/lib/auth-helpers";
import { inviteEmailContent } from "@/lib/invite-email";
import { sendInviteEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const roleSchema = z.enum(USER_ROLES);

export const inviteRouter = t.router({
  preview: reviewerProcedure
    .input(z.object({ role: roleSchema }))
    .query(({ input }) => inviteEmailContent(input.role)),

  list: reviewerProcedure.query(async () => {
    const invites = await prisma.invite.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        acceptedAt: true,
        createdAt: true,
      },
    });

    return invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      roleLabel: roleLabel(invite.role),
      accepted: Boolean(invite.acceptedAt),
      createdAt: invite.createdAt.toISOString(),
    }));
  }),

  create: reviewerProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: roleSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const email = input.email.trim().toLowerCase();
      const role: UserRole = input.role;
      const existingUser = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true },
      });

      const invite = await prisma.invite.upsert({
        where: { email },
        create: {
          email,
          role,
          invitedById: ctx.user.id,
          acceptedAt: existingUser ? new Date() : null,
        },
        update: {
          role,
          invitedById: ctx.user.id,
          acceptedAt: existingUser ? new Date() : null,
        },
      });

      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role },
        });
      }

      await sendInviteEmail({ to: email, role });

      return {
        id: invite.id,
        email: invite.email,
        role,
        accepted: Boolean(existingUser),
      };
    }),
});
