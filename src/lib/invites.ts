import { USER_ROLES, type UserRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

function isUserRole(role: string): role is UserRole {
  return (USER_ROLES as readonly string[]).includes(role);
}

export async function applyPendingInvite(user: { id: string; email: string }) {
  const email = user.email.trim().toLowerCase();
  const invite = await prisma.invite.findUnique({ where: { email } });

  if (!invite || invite.acceptedAt || !isUserRole(invite.role)) return;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { role: invite.role },
    }),
    prisma.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
  ]);
}
