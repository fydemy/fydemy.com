import { t } from "@/lib/trpc/trpc";
import { helloRouter } from "./routes/hello";
import { applicationRouter } from "./routes/application";
import { reviewRouter } from "./routes/review";
import { materialRouter } from "./routes/material";
import { mentorRouter } from "./routes/mentor";
import { partnerRouter } from "./routes/partner";
import { userRouter } from "./routes/user";
import { inviteRouter } from "./routes/invite";

export const appRouter = t.router({
  hello: helloRouter,
  user: userRouter,
  invite: inviteRouter,
  application: applicationRouter,
  review: reviewRouter,
  mentor: mentorRouter,
  partner: partnerRouter,
  material: materialRouter,
});

export type AppRouter = typeof appRouter;
