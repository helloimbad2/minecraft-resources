import { useEffect, useState } from "react";
import { getTextureCandidates, type TextureCandidate } from "@/data/items";
import { cn } from "@/lib/utils";

interface ItemSpriteProps {
  name: string;
  alt: string;
  className?: string;
  /** Pixel size used when the item renders as a 3D block cube. */
  size?: number;
}

/**
 * Renders a Minecraft item using up-to-date 1.21 textures.
 * - Real items render as a flat sprite.
 * - Full blocks render as a smooth isometric 3D cube.
 * The best candidate is resolved by preloading each URL in order.
 */
export function ItemSprite({ name, alt, className, size = 44 }: ItemSpriteProps) {
  const candidates = getTextureCandidates(name);
  const [resolved, setResolved] = useState<TextureCandidate | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setResolved(null);
    setFailed(false);

    const tryAt = (i: number) => {
      if (cancelled) return;
      if (i >= candidates.length) {
        setFailed(true);
        return;
      }
      const img = new Image();
      img.onload = () => {
        if (!cancelled) setResolved(candidates[i]);
      };
      img.onerror = () => tryAt(i + 1);
      img.src = candidates[i].url;
    };
    tryAt(0);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  if (failed) {
    return (
      <div
        className={cn(
          "flex select-none items-center justify-center bg-muted/60 font-display text-muted-foreground",
          className,
        )}
        aria-label={alt}
      >
        ?
      </div>
    );
  }

  if (!resolved) {
    return <div className={cn("bg-muted/20", className)} aria-label={alt} />;
  }

  if (resolved.type === "cube") {
    return (
      <div
        className={cn("mc-cube-wrap", className)}
        style={{ perspective: size * 6 }}
        aria-label={alt}
        role="img"
      >
        <div className="mc-cube" style={{ ["--cube" as string]: `${size}px` }}>
          <div
            className="mc-cube__face mc-cube__face--front"
            style={{ backgroundImage: `url(${resolved.url})` }}
          />
          <div
            className="mc-cube__face mc-cube__face--right"
            style={{ backgroundImage: `url(${resolved.url})` }}
          />
          <div
            className="mc-cube__face mc-cube__face--top"
            style={{ backgroundImage: `url(${resolved.top ?? resolved.url})` }}
          />
        </div>
      </div>
    );
  }

  return (
    <img
      src={resolved.url}
      alt={alt}
      loading="lazy"
      className={cn(
        // Pre-rendered mc-icons look best with smooth scaling; raw textures stay crisp/pixelated.
        resolved.type === "render" ? "object-contain" : "pixelated object-contain",
        className,
      )}
    />
  );
}
