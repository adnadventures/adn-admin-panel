"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bus,
  Eye,
  Hotel,
  Image as ImageIcon,
  Loader2,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { VendorImage } from "@/types/models";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Props = {
  vendorType: "travels" | "hotel";
  initialImages?: VendorImage[];
  onChange: (images: VendorImage[]) => void;
};

export function VendorImageUploader({
  vendorType,
  initialImages = [],
  onChange,
}: Props) {
  const [images, setImages] = useState<VendorImage[]>(initialImages);
  const [prevInitial, setPrevInitial] = useState(initialImages);
  if (prevInitial !== initialImages) {
    setPrevInitial(initialImages);
    setImages(initialImages);
  }
  const [isUploading, setIsUploading] = useState(false);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const validFiles: File[] = [];

    for (const file of fileList) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" has an unsupported format. Use JPEG, PNG, or WebP.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds the 8MB size limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    const uploadedImages: VendorImage[] = [];

    try {
      for (const file of validFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("vendorType", vendorType);

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
          uploadedImages.push(res.image);
        } else {
          const errMsg = !res.ok ? res.error : `Failed to upload ${file.name}`;
          toast.error(errMsg || `Failed to upload ${file.name}`);
        }
      }

      if (uploadedImages.length > 0) {
        const updated = [...images, ...uploadedImages];
        setImages(updated);
        onChange(updated);
        toast.success(`Successfully uploaded ${uploadedImages.length} image(s)`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("An error occurred during image upload.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveImage(img: VendorImage) {
    const updated = images.filter((i) => i.id !== img.id && i.objectKey !== img.objectKey);
    setImages(updated);
    onChange(updated);

    try {
      fetch(`/api/vendors/images?key=${encodeURIComponent(img.objectKey)}`, {
        method: "DELETE",
      }).catch(() => deleteVendorImageAction(img.objectKey));
    } catch (err) {
      console.error("Delete from R2 error:", err);
    }
  }

  const isTravels = vendorType === "travels";
  const title = isTravels ? "Bus & Fleet Photos" : "Hotel & Property Photos";
  const desc = isTravels
    ? "Upload multiple high-quality photos of buses, seating layouts, and interiors. Max 8MB per image."
    : "Upload photos of guest rooms, lobby, facade, amenities, and dining areas. Max 8MB per image.";

  return (
    <Card className={isTravels ? "border-blue-500/20 bg-blue-500/5" : "border-purple-500/20 bg-purple-500/5"}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {isTravels ? (
                <Bus className="size-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <Hotel className="size-5 text-purple-600 dark:text-purple-400" />
              )}
              {title}
            </CardTitle>
            <CardDescription className="text-xs">{desc}</CardDescription>
          </div>
          <span className="rounded-full bg-background border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            {images.length} {images.length === 1 ? "image" : "images"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop / Select zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/60 p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFilesSelected}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-xs font-medium">Uploading images to Cloudflare R2…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <Upload className="size-5" />
              </div>
              <p className="font-semibold text-xs">
                Click to select &amp; upload multiple images
              </p>
              <p className="text-[11px] text-muted-foreground">
                Supported formats: JPEG, PNG, WebP (up to 8MB each)
              </p>
            </div>
          )}
        </div>

        {/* Uploaded Thumbnails Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {images.map((img) => (
              <div
                key={img.id || img.objectKey}
                className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/40 shadow-xs"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name || "Vendor image"}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />

                {/* Overlay actions */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewModalUrl(img.url);
                    }}
                    className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/40 transition-colors"
                    title="View fullscreen"
                  >
                    <Eye className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(img);
                    }}
                    className="rounded-full bg-destructive/80 p-1.5 text-white hover:bg-destructive transition-colors"
                    title="Delete image"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fullscreen Preview Modal */}
        {previewModalUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setPreviewModalUrl(null)}
          >
            <div className="relative max-h-[90vh] max-w-4xl" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="absolute -top-10 right-0 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/40"
              >
                <X className="size-6" />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewModalUrl}
                alt="Fullscreen Preview"
                className="max-h-[85vh] w-auto rounded-lg object-contain shadow-2xl"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
