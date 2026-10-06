import React, { useCallback, useState } from "react";

interface ImgProps {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
  /** kanji glyph rendered behind / on error — gives every tile a soul */
  glyph?: string;
}

/**
 * Production image: shimmer placeholder until decoded, soft fade-in,
 * and a designed fallback tile when the network fails — never a broken icon.
 */
const Img: React.FC<ImgProps> = ({
  src,
  alt,
  className = "",
  imgClassName = "",
  eager = false,
  glyph = "映",
}) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const onLoad = useCallback(() => setLoaded(true), []);
  const onError = useCallback(() => setFailed(true), []);

  return (
    <div className={`relative overflow-hidden bg-zinc-800/80 ${className}`}>
      {!failed && src ? (
        <>
          {!loaded && <div className="shimmer absolute inset-0" aria-hidden="true" />}
          <img
            src={src}
            alt={alt}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            onLoad={onLoad}
            onError={onError}
            className={`h-full w-full object-cover transition-opacity duration-500 ${
              loaded ? "opacity-100" : "opacity-0"
            } ${imgClassName}`}
          />
        </>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900"
          role="img"
          aria-label={alt}
        >
          <span className="font-jp select-none text-3xl font-bold text-zinc-700">{glyph}</span>
        </div>
      )}
    </div>
  );
};

export default Img;
