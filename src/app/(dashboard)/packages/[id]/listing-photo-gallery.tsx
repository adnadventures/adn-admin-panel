"use client";

import Image from "next/image";
import { useState } from "react";

export function ListingPhotoGallery({
  photos,
  packageName,
  listingName,
}: {
  photos: string[];
  packageName: string;
  listingName: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visiblePhotos = expanded ? photos : photos.slice(0, 3);
  const remaining = photos.length - 3;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {visiblePhotos.map((src, index) => (
        <div key={`${src}-${index}`} className="relative">
          <Image
            src={src}
            alt={`${packageName} ${listingName} photo ${index + 1}`}
            width={640}
            height={360}
            unoptimized
            className="aspect-video w-full rounded object-cover"
          />
          {!expanded && index === 2 && remaining > 0 && (
            <button
              type="button"
              aria-label={`Show ${remaining} more photos`}
              onClick={() => setExpanded(true)}
              className="absolute inset-0 flex items-center justify-center rounded bg-black/60 text-2xl font-semibold text-white hover:bg-black/70"
            >
              +{remaining}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
