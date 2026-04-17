import { headers } from "next/headers";
import { t } from "./trpc";
import { auth } from "@/lib/auth";
import { TRPCError } from "@trpc/server";

export { t };

export const createTRPCContext = async (): Promise<TRPCContext> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return { user: session?.user || null };
};

export type TRPCContext = {
  user: typeof auth.$Infer.Session.user | null;
};

export const publicProcedure = t.procedure;

type AuthUser = NonNullable<TRPCContext["user"]>;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  return next({ ctx: { ...ctx, user: ctx.user as AuthUser } });
});
