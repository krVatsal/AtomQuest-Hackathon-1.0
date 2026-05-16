"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SubmitButtonProps {
  sheetId: string;
  totalWeightage: number;
  goalCount: number;
  isDraft: boolean;
}

export function SubmitButton({
  sheetId,
  totalWeightage,
  goalCount,
  isDraft,
}: SubmitButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = isDraft && totalWeightage === 100 && goalCount >= 1;

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/sheets/${sheetId}/submit`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Submission failed");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const disabledReason = !isDraft
    ? "Sheet is already submitted"
    : goalCount === 0
      ? "Add at least one goal"
      : totalWeightage !== 100
        ? `Weightage must be exactly 100% (currently ${totalWeightage}%)`
        : null;

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          disabled={!canSubmit}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:pointer-events-none disabled:opacity-50"
        >
          Submit Goal Sheet
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Goal Sheet?</DialogTitle>
            <DialogDescription>
              Once submitted, you will not be able to edit your goals until the
              sheet is returned by your manager. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Submitting..." : "Confirm Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {disabledReason && !canSubmit && (
        <p className="mt-1 text-xs text-muted-foreground">{disabledReason}</p>
      )}
    </div>
  );
}
