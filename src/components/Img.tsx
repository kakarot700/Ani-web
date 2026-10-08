import React, { useCallback, useState } from "react";

interface ImgProps {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
  /** kept for call-site compatibility; no glyph is rendered any more */
  glyph?: string;
}

/**
 * Production image: shimmer placeholder until decoded, soft fade-in,
 * and a calm fallback tile when the network fails — never a broken icon.
 */
const Img: React.FC<ImgProps> = ({
  src,
  alt,
  className = "",
  imgClassName = "",
  eager = false,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const onLoad = useCallback(() => setLoaded(true), []);
  const onError = useCallback(() => setFailed(true), []);

  return (
    <div className={`relative overflow-hidden bg-white/[0.07] ${className}`}>
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
          className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/[0.1] to-white/[0.03]"
          role="img"
          aria-label={alt}
        >
          <span className="h-7 w-7 rounded-full border border-white/25 bg-white/10" />
        </div>
      )}
    </div>
  );
};

export default Img;
