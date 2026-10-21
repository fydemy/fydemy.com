import { Resend } from "resend";
import type { UserRole } from "@/lib/auth-helpers";
import { inviteEmailContent } from "@/lib/invite-email";
import { siteConfig } from "@/lib/seo";

const from = process.env.RESEND_FROM_EMAIL ?? "Fydemy <onboarding@resend.dev>";
const cc = process.env.RESEND_CC_EMAIL?.trim() || undefined;

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
};

async function sendEmail({ to, subject, text }: SendEmailInput) {
  const resend = getResend();

  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing — skipping send:", subject);
    return { id: "skipped" };
  }

  const { data, error } = await resend.emails.send({
    from,
    to,
    ...(cc ? { cc } : {}),
    subject,
    text,
  });

  if (error) {
    console.error("[email] failed:", error);
    throw new Error(error.message);
  }

  return data;
}

function formatBody(lines: string[]) {
  return [...lines, "", siteConfig.name].join("\n");
}

const appUrl = `${siteConfig.url}/app`;

export async function sendApplicationReceivedEmail(input: {
  to: string[];
  productName: string;
  applicantName: string;
}) {
  return sendEmail({
    to: input.to,
    subject: `Thanks for applying to ${siteConfig.name}, ${input.productName}`,
    text: formatBody([
      `Hi ${input.applicantName},`,
      `Congratulations on applying to ${siteConfig.name}!`,
      "",
      `Your application for ${input.productName} has been submitted.`,
      "",
      `To review your application, visit ${appUrl}.`,
      `Join our community: ${siteConfig.discordInviteUrl}`,
      "",
      "Good luck!",
    ]),
  });
}

export async function sendApplicationApprovedEmail(input: {
  to: string[];
  productName: string;
  applicantName: string;
}) {
  return sendEmail({
    to: input.to,
    subject: `You're accepted! Welcome to ${siteConfig.name}, ${input.productName}`,
    text: formatBody([
      `Hi ${input.applicantName},`,
      `Congratulations on being accepted to ${siteConfig.name}!`,
      "",
      `Your application for ${input.productName} has been accepted.`,
      "",
      `To review your next steps, visit ${siteConfig.joinUrl}.`,
      "",
      "Welcome aboard!",
    ]),
  });
}

export async function sendInviteEmail(input: { to: string; role: UserRole }) {
  const email = inviteEmailContent(input.role);

  return sendEmail({
    to: input.to,
    subject: email.subject,
    text: email.text,
  });
}

export async function sendApplicationRejectedEmail(input: {
  to: string[];
  productName: string;
  applicantName: string;
}) {
  return sendEmail({
    to: input.to,
    subject: `An update on your application for ${input.productName}`,
    text: formatBody([
      `Hi ${input.applicantName},`,
      `Thank you for applying to ${siteConfig.name}.`,
      "",
      `Your application for ${input.productName} was not selected this time.`,
      "",
      `To view your application status, visit ${appUrl}.`,
      "",
      "Good luck!",
    ]),
  });
}
