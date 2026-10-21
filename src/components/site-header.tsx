"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  MaterialsSiteBreadcrumb,
  getMaterialsRoute,
} from "@/components/materials-site-breadcrumb";
import { ApplicationReviewHeaderActions } from "@/components/application-review-header-actions";

const titles: Record<string, string> = {
  "/app": "Applications",
};

function getTitle(pathname: string) {
  if (titles[pathname]) return titles[pathname];
  if (pathname === "/app/invites") return "Invites";
  if (pathname.startsWith("/app/")) return "Application";
  return "Dashboard";
}

export function SiteHeader() {
  const pathname = usePathname();
  const materials = getMaterialsRoute(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full min-w-0 items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-vertical:self-auto"
        />
        <div className="min-w-0 flex-1">
          {materials ? (
            <Suspense
              fallback={
                <h1 className="text-base font-medium tracking-tight">Workspace</h1>
              }
            >
              <MaterialsSiteBreadcrumb />
            </Suspense>
          ) : (
            <h1 className="text-base font-medium tracking-tight">
              {getTitle(pathname)}
            </h1>
          )}
        </div>
        <ApplicationReviewHeaderActions />
      </div>
    </header>
  );
}
