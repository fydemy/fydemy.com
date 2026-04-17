import { t } from "@/lib/trpc/trpc";
import { productsRouter } from "./routes/products";
import { commentsRouter } from "./routes/comments";
import { profileRouter } from "./routes/profile";

export const appRouter = t.router({
  products: productsRouter,
  comments: commentsRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;
