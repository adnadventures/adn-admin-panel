"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface PageBackButtonProps {
  href: string;
  label?: string;
  hasUnsavedChanges?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
  className?: string;
}

export function PageBackButton({
  href,
  label = "Back",
  hasUnsavedChanges = false,
  confirmTitle = "Unsaved Changes",
  confirmMessage = "You have unsaved changes. Leaving will discard the details you entered. Are you sure you want to go back?",
  className = "",
}: PageBackButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (hasUnsavedChanges) {
      setShowConfirm(true);
    } else {
      router.push(href);
    }
  };

  const handleConfirmDiscard = () => {
    setShowConfirm(false);
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all group py-1 px-2.5 rounded-lg border border-border/70 bg-card hover:bg-muted shadow-2xs mb-2.5 cursor-pointer select-none shrink-0 ${className}`}
        title={label}
        aria-label={label}
      >
        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5 shrink-0" />
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">Back</span>
      </button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground font-semibold text-base">
              <AlertTriangle className="size-4 text-amber-500 shrink-0" />
              {confirmTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground pt-1 leading-relaxed">
              {confirmMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel
              variant="outline"
              size="sm"
              onClick={() => setShowConfirm(false)}
              className="text-xs font-medium"
            >
              Stay and Keep Editing
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              size="sm"
              onClick={handleConfirmDiscard}
              className="text-xs font-semibold"
            >
              Discard & Go Back
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
