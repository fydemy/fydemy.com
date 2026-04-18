"use client";

import { useState } from "react";
import { QueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error: unknown) => {
          const code = (error as { data?: { code?: string } })?.data?.code;
          if (code === "NOT_FOUND" || code === "UNAUTHORIZED" || code === "FORBIDDEN") {
            return false;
          }
          return failureCount < 3;
        },
      },
    },
  });
}

const TRPCLayout = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(makeQueryClient);
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          async fetch(url, options) {
            return fetch(url, options);
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
};

export default TRPCLayout;
