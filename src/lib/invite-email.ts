import { roleLabel, type UserRole } from "@/lib/auth-helpers";
import { siteConfig } from "@/lib/seo";

function articleFor(label: string) {
  return /^[aeiou]/i.test(label) ? "an" : "a";
}

export function inviteEmailContent(role: UserRole) {
  const label = roleLabel(role);
  const article = articleFor(label);

  return {
    subject: `You're invited to ${siteConfig.name} as ${article} ${label}`,
    text: [
      "Hi,",
      `You've been invited to ${siteConfig.name} as ${article} ${label}.`,
      "",
      `To get started, visit ${siteConfig.url}.`,
      "",
      "Welcome aboard!",
      "",
      siteConfig.name,
    ].join("\n"),
  };
}
