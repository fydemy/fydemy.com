import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { t } from "../trpc";
import { applicantProcedure, staffProcedure } from "../context";
import { prisma } from "@/lib/prisma";
import { isMentor } from "@/lib/auth-helpers";
import {
  findApprovedApplicationForUser,
  findApplicationsForUser,
} from "@/lib/application-access";
import { ensureApplicationWorkspace } from "@/lib/application-workspace";
import { DEFAULT_APPLICATION_COHORT } from "@/lib/cohort";
import { sendApplicationReceivedEmail } from "@/lib/email";
import {
  readPitchDeckMeta,
  resolvePitchDeckStoragePath,
} from "@/lib/pitchdecks";
import { logoBelongsToUser } from "@/lib/logos";
import {
  applicantFormSchema,
  encodeScreeningPayload,
  ideaStageHasDeckAlternative,
  isIdeaStage,
  normalizeApplicantForm,
  parseScreeningPayload,
} from "@/lib/screening";

const memberSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  linkedin: z.string().url(),
});

export const applicationRouter = t.router({
  me: applicantProcedure.query(async ({ ctx }) => {
    const applications = await findApplicationsForUser({
      id: ctx.user.id,
      email: ctx.user.email,
    });

    const ownedApplications = applications.filter(
      (application) => application.userId === ctx.user.id,
    );
    const latest = ownedApplications[0] ?? null;
    const approved =
      applications.find((application) => application.status === "APPROVED") ??
      null;

    return {
      applications,
      latest,
      approved,
      canApply: !latest || latest.status === "APPROVED",
    };
  }),

  create: applicantProcedure
    .input(
      z.object({
        screening: applicantFormSchema,
        logoUrl: z.string().optional(),
        discordUsername: z.string().min(2).max(37),
        pitchDeckUrl: z.string(),
        pitchDeckName: z.string(),
        members: z.array(memberSchema),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const latest = await prisma.application.findFirst({
        where: { userId: ctx.user.id },
        orderBy: { createdAt: "desc" },
      });

      if (latest && latest.status !== "APPROVED") {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            latest.status === "PENDING"
              ? "You already have a pending application"
              : "You can only submit a new application after your latest one is accepted",
        });
      }

      const screening = normalizeApplicantForm(input.screening);
      const ideaOptional =
        isIdeaStage(screening.company.product_stage) &&
        ideaStageHasDeckAlternative(screening.company);
      const hasPitchDeck = Boolean(
        input.pitchDeckUrl.trim() && input.pitchDeckName.trim(),
      );

      if (!hasPitchDeck && !ideaOptional) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: isIdeaStage(screening.company.product_stage)
            ? "Upload a pitch deck, or provide a mock-up link or written brief"
            : "Upload a pitch deck file before submitting",
        });
      }

      let pitchDeckUrl = "";
      let pitchDeckName = "";
      if (hasPitchDeck) {
        const pitchDeckPath = resolvePitchDeckStoragePath(input.pitchDeckUrl);
        const pitchDeckMeta = pitchDeckPath
          ? readPitchDeckMeta(pitchDeckPath)
          : null;

        if (!pitchDeckMeta || pitchDeckMeta.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Upload a pitch deck file before submitting",
          });
        }
        pitchDeckUrl = input.pitchDeckUrl;
        pitchDeckName = input.pitchDeckName;
      }

      let logoUrl: string | null = null;
      if (input.logoUrl) {
        if (!logoBelongsToUser(input.logoUrl, ctx.user.id)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Upload a valid logo before submitting",
          });
        }
        logoUrl = input.logoUrl;
      }

      const linkedin = screening.founder.founder_contact.trim();

      const application = await prisma.application.create({
        data: {
          name: screening.company.company_name.trim(),
          description: encodeScreeningPayload({
            version: 1,
            form: screening,
            evaluation: null,
          }),
          logoUrl,
          websiteUrl:
            screening.company.company_website?.trim() ||
            screening.company.demo_link?.trim() ||
            null,
          linkedin,
          discordUsername: input.discordUsername.trim(),
          pitchDeckUrl,
          pitchDeckName,
          cohort: DEFAULT_APPLICATION_COHORT,
          userId: ctx.user.id,
          members: {
            create: input.members,
          },
        },
        include: { members: true },
      });

      const recipients = [
        ...new Set([
          ctx.user.email,
          ...application.members.map((member) => member.email),
        ]),
      ];

      await sendApplicationReceivedEmail({
        to: recipients,
        productName: application.name,
        applicantName: ctx.user.name,
      });

      return application;
    }),

  listAccepted: applicantProcedure.query(async ({ ctx }) => {
    const user = { id: ctx.user.id, email: ctx.user.email };
    const approved = await findApprovedApplicationForUser(user);

    if (!approved) {
      return [];
    }

    const ownApplications = await findApplicationsForUser(user);
    const ownIds = ownApplications.map((application) => application.id);

    const applications = await prisma.application.findMany({
      where: {
        status: "APPROVED",
        ...(ownIds.length > 0 ? { id: { notIn: ownIds } } : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        linkedin: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return applications.map((application) => {
      const payload = parseScreeningPayload(application.description);
      return {
        id: application.id,
        linkedin:
          application.linkedin ||
          payload?.form.founder.founder_contact ||
          "",
        name:
          payload?.form.founder.founder_name?.trim() ||
          application.user.name,
        logoUrl: application.logoUrl,
        companyName: application.name,
        productDescription:
          payload?.form.company.product_description?.trim() || "",
      };
    });
  }),

  getWorkspace: staffProcedure
    .input(z.object({ applicationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const application = await assertStaffCanViewApplication(
        ctx.user.role,
        input.applicationId,
      );
      if (application.status !== "APPROVED") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Approved application not found",
        });
      }

      const { folder, logFile } = await ensureApplicationWorkspace({
        id: application.id,
        name: application.name,
        userId: application.userId,
      });

      const items = await prisma.materialItem.findMany({
        where: { parentId: folder.id },
        select: {
          id: true,
          name: true,
          type: true,
          locked: true,
          updatedAt: true,
        },
        orderBy: [{ type: "asc" }, { name: "asc" }],
      });

      return {
        folder: {
          id: folder.id,
          name: folder.name,
        },
        items,
        kanbanLog: {
          id: logFile.id,
          name: logFile.name,
          content: logFile.content ?? "",
        },
      };
    }),
});

async function assertStaffCanViewApplication(role: string, applicationId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });
  if (!application) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });
  }
  if (isMentor(role) && application.status !== "APPROVED") {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Approved application not found",
    });
  }
  return application;
}
