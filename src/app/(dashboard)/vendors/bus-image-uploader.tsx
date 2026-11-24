"use client";

import { useRef, useState } from "react";
import {
  Eye,
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteVendorImageAction,
  uploadVendorImageAction,
} from "@/actions/vendors";
import { Button } from "@/components/ui/button";
import type { VendorImage } from "@/types/models";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type BusImageUploaderProps = {
  busIndex: number;
  busNumber?: string;
  images?: VendorImage[];
  imageUrls?: string[];
  onChange: (images: VendorImage[], imageUrls: string[]) => void;
  disabled?: boolean;
};

export function BusImageUploader({
  busIndex,
  busNumber,
  images = [],
  imageUrls = [],
  onChange,
  disabled = false,
}: BusImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

  const addFileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  const displayName = busNumber?.trim() || `Bus #${busIndex + 1}`;

  // Normalize images list from either images or imageUrls
  const activeImages: VendorImage[] =
    images && images.length > 0
      ? images
      : (imageUrls || []).map((url, idx) => ({
          id: `img-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          name: `${displayName} Photo ${idx + 1}`,
          objectKey: url.includes("key=") ? decodeURIComponent(url.split("key=")[1].split("&")[0]) : "",
          url,
          size: 0,
          contentType: "image/jpeg",
          uploadedAt: new Date().toISOString(),
        }));

  async function uploadSingleFile(file: File): Promise<VendorImage | null> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("vendorType", "travels");

    let res: { ok: boolean; image?: VendorImage; error?: string };
    try {
      const response = await fetch("/api/vendors/images", {
        method: "POST",
        body: formData,
      });
      res = await response.json();
    } catch {
      res = await uploadVendorImageAction(formData);
    }

    if (res.ok && res.image) {
      return res.image;
    }

    const errMsg = !res.ok ? res.error : "Upload failed";
    toast.error(errMsg || `Failed to upload "${file.name}"`);
    return null;
  }

  async function handleAddFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const validFiles: File[] = [];

    for (const file of fileList) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" is unsupported. Use JPEG, PNG, or WebP.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds the 8MB size limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      if (addFileInputRef.current) addFileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);

    try {
      const newUploaded: VendorImage[] = [];
      for (const file of validFiles) {
        const uploaded = await uploadSingleFile(file);
        if (uploaded) {
          newUploaded.push(uploaded);
        }
      }

      if (newUploaded.length > 0) {
        const updated = [...activeImages, ...newUploaded];
        onChange(updated, updated.map((img) => img.url));
        toast.success(`Uploaded ${newUploaded.length} photo(s) for ${displayName}`);
      }
    } catch (err) {
      console.error("Add bus images error:", err);
      toast.error("An error occurred while uploading photos.");
    } finally {
      setIsUploading(false);
      if (addFileInputRef.current) addFileInputRef.current.value = "";
    }
  }

  async function handleReplaceFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || replacingIndex === null) {
      setReplacingIndex(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(`"${file.name}" is unsupported. Use JPEG, PNG, or WebP.`);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
      setReplacingIndex(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`"${file.name}" exceeds 8MB.`);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
      setReplacingIndex(null);
      return;
    }

    const targetIdx = replacingIndex;
    const oldImage = activeImages[targetIdx];
    setIsUploading(true);

    try {
      const uploaded = await uploadSingleFile(file);
      if (uploaded) {
        // Delete old image from R2 if it has an objectKey
        if (oldImage?.objectKey) {
          fetch(`/api/vendors/images?key=${encodeURIComponent(oldImage.objectKey)}`, {
            method: "DELETE",
          }).catch(() => deleteVendorImageAction(oldImage.objectKey));
        }

        const updated = [...activeImages];
        updated[targetIdx] = uploaded;
        onChange(updated, updated.map((img) => img.url));
        toast.success(`Replaced photo ${targetIdx + 1} for ${displayName}`);
      }
    } catch (err) {
      console.error("Replace image error:", err);
      toast.error("Failed to replace photo.");
    } finally {
      setIsUploading(false);
      setReplacingIndex(null);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
    }
  }

  async function handleRemoveImage(targetIdx: number) {
    if (disabled || isUploading) return;
    const toRemove = activeImages[targetIdx];
    if (!toRemove) return;

    const updated = activeImages.filter((_, idx) => idx !== targetIdx);
    onChange(updated, updated.map((img) => img.url));

    if (toRemove.objectKey) {
      fetch(`/api/vendors/images?key=${encodeURIComponent(toRemove.objectKey)}`, {
        method: "DELETE",
      }).catch(() => deleteVendorImageAction(toRemove.objectKey));
    }

    toast.info(`Removed photo ${targetIdx + 1} from ${displayName}`);
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <ImageIcon className="size-3.5 text-primary" />
            {displayName} Photos
          </label>
          {activeImages.length > 0 && (
            <span className="rounded-full bg-primary/10 text-primary px-2 py-0.2 text-[10px] font-semibold">
              {activeImages.length} {activeImages.length === 1 ? "photo" : "photos"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            JPEG, PNG, WebP · Max 8MB
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isUploading}
            onClick={() => addFileInputRef.current?.click()}
            className="h-7 px-2.5 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/5"
          >
            {isUploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            <span>Add Photos</span>
          </Button>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={addFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        disabled={disabled || isUploading}
        onChange={handleAddFiles}
      />

      <input
        ref={replaceFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={handleReplaceFile}
      />

      {/* Uploading Banner */}
      {isUploading && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-primary font-medium">
          <Loader2 className="size-4 animate-spin shrink-0" />
          <span>Uploading bus photo(s) to Cloudflare R2…</span>
        </div>
      )}

      {/* Image Gallery */}
      {activeImages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {activeImages.map((img, idx) => (
            <div
              key={img.id || `${img.url}-${idx}`}
              className="flex items-center justify-between gap-2.5 p-2 rounded-lg border border-border/80 bg-muted/20 hover:bg-muted/30 transition-colors"
            >
              {/* Thumbnail + Details */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md border border-border/80 bg-muted cursor-pointer group"
                  onClick={() => setPreviewModalUrl(img.url)}
                  title="Click to view full image"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={`${displayName} photo ${idx + 1}`}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Eye className="size-3.5 text-white" />
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate max-w-[110px] sm:max-w-[130px]">
                    {img.name || `Photo #${idx + 1}`}
                  </p>
                  {img.size ? (
                    <p className="text-[10px] text-muted-foreground">
                      {(img.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">
                      Photo {idx + 1}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled || isUploading}
                  onClick={() => setPreviewModalUrl(img.url)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  title="View full photo"
                >
                  <Eye className="size-3.5" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled || isUploading}
                  onClick={() => {
                    setReplacingIndex(idx);
                    replaceFileInputRef.current?.click();
                  }}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  title="Replace this photo"
                >
                  <RefreshCw className="size-3.5" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled || isUploading}
                  onClick={() => handleRemoveImage(idx)}
                  className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                  title="Remove this photo"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State Dropzone */
        <div
          onClick={() => {
            if (!disabled && !isUploading) {
              addFileInputRef.current?.click();
            }
          }}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/80 bg-muted/10 p-4 text-center transition-colors hover:bg-muted/30 cursor-pointer ${
            isUploading ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Upload className="size-4 text-primary" />
            <span className="font-semibold text-foreground">
              Upload photos for {displayName}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Click to select multiple photos (JPEG, PNG, WebP up to 8MB each)
          </p>
        </div>
      )}

      {/* Lightbox Modal */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-xl bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="font-semibold text-sm">
                {displayName} — Full Photo Preview
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewModalUrl}
                alt={displayName}
                className="max-h-[75vh] w-auto max-w-full rounded object-contain mx-auto"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
