"use client";

import * as React from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc/client";
import { NavMain, type NavItem } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { siteConfig } from "@/lib/seo";
import { Logo } from "@/components/ui/optimized-image";
import {
  ClipboardCheckIcon,
  FileTextIcon,
  MailIcon,
  MessageCircleIcon,
  PackageIcon,
} from "lucide-react";

const discordNavItem: NavItem = {
  title: "Community",
  url: siteConfig.discordInviteUrl,
  icon: <MessageCircleIcon />,
  external: true,
};

const applicantNav: NavItem[] = [
  {
    title: "Applications",
    url: "/app",
    icon: <FileTextIcon />,
  },
  {
    title: "Workspace",
    url: "/workspace",
    icon: <PackageIcon />,
  },
  discordNavItem,
];

const staffNav: NavItem[] = [
  {
    title: "Applications",
    url: "/app",
    icon: <ClipboardCheckIcon />,
  },
  {
    title: "Workspace",
    url: "/workspace",
    icon: <PackageIcon />,
  },
  discordNavItem,
];

const reviewerNav: NavItem[] = [
  staffNav[0],
  staffNav[1],
  {
    title: "Invites",
    url: "/app/invites",
    icon: <MailIcon />,
  },
  discordNavItem,
];

const partnerNav: NavItem[] = [
  {
    title: "Applications",
    url: "/app",
    icon: <ClipboardCheckIcon />,
  },
  discordNavItem,
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession();
  const { data: me } = trpc.user.me.useQuery();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const user = session?.user;

  const nav = React.useMemo(() => {
    if (!me) return null;
    if (me.isReviewer) return { items: reviewerNav, label: "Review" };
    if (me.isMentor) return { items: staffNav, label: "Mentor" };
    if (me.isPartner) return { items: partnerNav, label: "Partner" };
    return {
      items: me.hasApprovedApplication
        ? applicantNav
        : applicantNav.filter((item) => item.url !== "/workspace"),
    };
  }, [me]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-auto! py-2 data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href="/" />}
            >
              <Logo
                src="/logo.svg"
                name="Fydemy"
                className="h-7 w-auto"
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {mounted && nav ? (
          <NavMain items={nav.items} label={nav.label} />
        ) : null}
      </SidebarContent>
      <SidebarFooter>
        {mounted && user ? (
          <NavUser
            user={{
              name: user.name,
              email: user.email,
              avatar: user.image ?? me?.image,
              roleLabel: me?.roleLabel ?? "Applicant",
            }}
          />
        ) : (
          <NavUserPlaceholder />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function NavUserPlaceholder() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="pointer-events-none">
          <div className="size-8 shrink-0 rounded-lg bg-muted" />
          <div className="grid flex-1 gap-1.5 text-left">
            <div className="h-3.5 w-24 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
