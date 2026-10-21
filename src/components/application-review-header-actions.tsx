"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

function applicationIdFromPath(pathname: string) {
  const match = pathname.match(/^\/app\/([^/]+)$/);
  const id = match?.[1] ?? null;
  if (!id || id === "invites") return null;
  return id;
}

export function ApplicationReviewHeaderActions() {
  const pathname = usePathname();
  const id = applicationIdFromPath(pathname);
  const { data: me } = trpc.user.me.useQuery();
  const utils = trpc.useUtils();
  const { data: application } = trpc.review.getApplication.useQuery(
    { id: id ?? "" },
    { enabled: Boolean(id) && Boolean(me?.isReviewer) },
  );
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | null>(
    null,
  );
  const [note, setNote] = useState("");

  const decide = trpc.review.decide.useMutation({
    onSuccess: async () => {
      if (!id) return;
      await Promise.all([
        utils.review.getApplication.invalidate({ id }),
        utils.review.listApplications.invalidate(),
      ]);
      toast.success("Decision saved and email sent");
      setDecision(null);
      setNote("");
    },
    onError: (err) => toast.error(err.message),
  });

  if (!id || !me?.isReviewer || application?.status !== "PENDING") {
    return null;
  }

  return (
    <>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Button size="sm" onClick={() => setDecision("APPROVED")}>
          <Check className="size-4" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setDecision("REJECTED")}
        >
          <X className="size-4" />
          Reject
        </Button>
      </div>

      <Dialog
        open={!!decision}
        onOpenChange={(open) => {
          if (!open) {
            setDecision(null);
            setNote("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision === "APPROVED" ? "Approve" : "Reject"} application
            </DialogTitle>
            <DialogDescription>
              Sends the Resend notification template to the applicant and
              members.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="header-review-note">Optional note</Label>
            <Textarea
              id="header-review-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant={decision === "APPROVED" ? "default" : "destructive"}
              disabled={decide.isPending}
              onClick={() => {
                if (!decision || !id) return;
                decide.mutate({
                  id,
                  status: decision,
                  note: note || undefined,
                });
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
