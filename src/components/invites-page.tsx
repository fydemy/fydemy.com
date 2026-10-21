"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { USER_ROLES, roleLabel, type UserRole } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function formatSentAt(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function InvitesPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: me, isLoading: meLoading } = trpc.user.me.useQuery();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("mentor");

  const invites = trpc.invite.list.useQuery(undefined, {
    enabled: Boolean(me?.isReviewer),
  });
  const preview = trpc.invite.preview.useQuery(
    { role },
    { enabled: Boolean(me?.isReviewer) },
  );

  useEffect(() => {
    if (me && !me.isReviewer) router.replace("/app");
  }, [me, router]);

  const create = trpc.invite.create.useMutation({
    onSuccess: async (invite) => {
      await utils.invite.list.invalidate();
      toast.success(
        invite.accepted
          ? "Invite sent and role assigned"
          : "Invite sent. The role applies when they sign up",
      );
      setEmail("");
    },
    onError: (error) => toast.error(error.message),
  });

  if (meLoading || !me?.isReviewer) return <Skeleton className="h-96" />;

  const recipient = email.trim() || "name@example.com";

  return (
    <div className="mt-12 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Invites</h1>
        <p className="text-sm text-muted-foreground">
          Invite any email and assign a role. They can sign up later.
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate({ email: email.trim(), role });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            required
            autoComplete="off"
            placeholder="name@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-role">Role</Label>
          <Select
            value={role}
            onValueChange={(value) => {
              if (value) setRole(value as UserRole);
            }}
          >
            <SelectTrigger id="invite-role" className="min-w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {USER_ROLES.map((value) => (
                <SelectItem key={value} value={value}>
                  {roleLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? <Loader2 className="animate-spin" /> : null}
          Send invite
        </Button>
      </form>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Email</h2>
        <Card>
          <CardContent className="space-y-3 p-4!">
            {preview.isLoading || !preview.data ? (
              <Skeleton className="h-40" />
            ) : (
              <>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">To </span>
                    {recipient}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Subject </span>
                    {preview.data.subject}
                  </p>
                </div>
                <pre className="text-sm leading-relaxed whitespace-pre-wrap">
                  {preview.data.text}
                </pre>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Sent</h2>
        <Card>
          <CardContent>
            {invites.isLoading ? (
              <Skeleton className="h-24" />
            ) : (invites.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No invites yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(invites.data ?? []).map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell>
                        <div className="font-medium">{invite.email}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatSentAt(invite.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>{invite.roleLabel}</TableCell>
                      <TableCell>
                        <Badge variant={invite.accepted ? "secondary" : "outline"}>
                          {invite.accepted ? "Assigned" : "Waiting to sign up"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
