"use client";

import { useEffect, useState } from "react";
import { Share } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SharePhotosButton({
  photoUrls,
}: {
  photoUrls: string[];
}) {
  const [sharing, setSharing] = useState(false);
  const [prepared, setPrepared] = useState<{ key: string; files: File[] } | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const photoKey = photoUrls.join("\n");
  const files = photoKey && prepared?.key === photoKey ? prepared.files : photoKey ? null : [];
  const failed = failedKey === photoKey;

  useEffect(() => {
    const controller = new AbortController();
    const urls = photoKey ? photoKey.split("\n") : [];

    if (urls.length === 0) return;

    void Promise.all(urls.map(async (url, index) => {
      const response = await fetch(`/api/package-photo?url=${encodeURIComponent(url)}`, {
        signal: controller.signal,
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error ?? "A photo could not be prepared for sharing");
      }
      const blob = await response.blob();
      const extension = blob.type === "image/jpeg" ? "jpg" : blob.type.split("/")[1];
      return new File([blob], `photo-${index + 1}.${extension}`, { type: blob.type });
    })).then((preparedFiles) => {
      if (!controller.signal.aborted) setPrepared({ key: photoKey, files: preparedFiles });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        setFailedKey(photoKey);
        toast.error(error instanceof Error ? error.message : "Could not prepare photos for sharing");
      }
    });

    return () => controller.abort();
  }, [photoKey, retry]);

  function sharePhotos() {
    if (!files && failed) {
      setRetry((attempt) => attempt + 1);
      return;
    }
    if (!navigator.share || typeof File === "undefined") {
      toast.error("Your browser does not support sharing photo files. Try this on your phone.");
      return;
    }
    if (!files?.length) return;

    if (!navigator.canShare?.({ files })) {
      toast.error("Your browser does not support sharing photo files. Try this on your phone.");
      return;
    }

    setSharing(true);
    const toastId = toast.loading("Opening share options…");
    void navigator.share({ files }).then(() => {
      toast.success("Photos shared", { id: toastId });
    }).catch((error: unknown) => {
      if (error instanceof Error && error.name === "AbortError") {
        toast.dismiss(toastId);
      } else {
        toast.error(error instanceof Error ? error.message : "Could not share the photos", { id: toastId });
      }
    }).finally(() => {
      setSharing(false);
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!photoKey || sharing || (!files?.length && !failed)}
      onClick={sharePhotos}
    >
      <Share className="mr-2 size-4" />
      {sharing ? "Sharing…" : failed ? "Retry photo preparation" : files === null ? "Preparing photos…" : "Share photos"}
    </Button>
  );
}
