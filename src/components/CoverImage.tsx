import { useEffect, useState } from "react";
import { getCoverSignedUrl, gradientFor } from "@/lib/knowledge";

interface Props {
  path: string | null | undefined;
  seed: string;
  className?: string;
  alt?: string;
}

// Cache signed URLs across mounts so list re-renders don't re-sign
const urlCache = new Map<string, { url: string; expires: number }>();

export function CoverImage({ path, seed, className, alt }: Props) {
  const [url, setUrl] = useState<string | null>(() => {
    if (!path) return null;
    const c = urlCache.get(path);
    return c && c.expires > Date.now() ? c.url : null;
  });

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }
    const cached = urlCache.get(path);
    if (cached && cached.expires > Date.now()) {
      setUrl(cached.url);
      return;
    }
    let alive = true;
    getCoverSignedUrl(path, 3600)
      .then((u) => {
        urlCache.set(path, { url: u, expires: Date.now() + 50 * 60 * 1000 });
        if (alive) setUrl(u);
      })
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
    };
  }, [path]);

  if (path && url) {
    return (
      <img
        src={url}
        alt={alt ?? ""}
        loading="lazy"
        className={className}
        style={{ objectFit: "cover" }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{ background: gradientFor(seed) }}
      aria-hidden
    />
  );
}
