// Typed client for discord-bot-gateway. Internal-only: a service name, not a domain.
const baseUrl = () => (process.env.GATEWAY_BASE_URL || "http://gateway:8080").replace(/\/+$/, "");

function token() {
  return process.env.GATEWAY_TOKEN?.trim() ?? "";
}

export type FounderRoleResult = { ok: boolean; url: string };

async function gatewayFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token()}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${baseUrl()}${path}`, { ...init, headers, cache: "no-store" });
}

// Assigns the Founder role. Always returns a url; a gateway outage falls back to it.
export async function assignFounderRole(input: {
  discordUserId: string;
  accessToken?: string;
  fallbackUrl: string;
}): Promise<FounderRoleResult> {
  if (!token()) {
    console.error("[gateway] GATEWAY_TOKEN is not set");
    return { ok: false, url: input.fallbackUrl };
  }

  try {
    const res = await gatewayFetch(
      `/members/${encodeURIComponent(input.discordUserId)}/founder-role`,
      {
        method: "POST",
        body: JSON.stringify(
          input.accessToken ? { accessToken: input.accessToken } : {},
        ),
      },
    );

    if (!res.ok) {
      console.error("[gateway] founder-role failed", res.status, await res.text());
      return { ok: false, url: input.fallbackUrl };
    }

    return (await res.json()) as FounderRoleResult;
  } catch (error) {
    console.error("[gateway] unreachable", error);
    return { ok: false, url: input.fallbackUrl };
  }
}
