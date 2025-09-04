// HoverImagePreview.tsx
import {useEffect, useState} from "react";
import {createPortal} from "react-dom";

export default function HoverImagePreview({
  src,
  alt = "",
  thumbClass = "h-12 w-12 rounded-md object-cover",
}: { src: string; alt?: string; thumbClass?: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [imageError, setImageError] = useState(false);

  // close on ESC / scroll
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onScroll = () => setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open]);

  const updatePos = (clientX: number, clientY: number) => {
    const pad = 16;
    let x = clientX + pad;
    let y = clientY + pad;
    const vw = window.innerWidth, vh = window.innerHeight;
    const w = 272, h = 272; // Fixed size: 240px + 16px padding on each side
    if (x + w > vw) x = vw - w - pad;
    if (y + h > vh) y = vh - h - pad;
    setPos({ x, y });
  };

  const preview = open && createPortal(
    <div
      className="fixed z-[9999] p-1 rounded-xl border border-neutral-700 bg-neutral-900/90 shadow-2xl
                 transition-all duration-150 ease-out data-[state=closed]:opacity-0 data-[state=closed]:scale-95"
      style={{ left: pos.x, top: pos.y }}
      data-state={open ? "open" : "closed"}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen(false)}
    >
      {imageError ? (
        <div className="w-[240px] h-[240px] bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-lg font-bold">
          {alt.slice(0, 2).toUpperCase()}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className="w-[240px] h-[240px] object-cover rounded-lg"
          draggable={false}
          onError={() => setImageError(true)}
        />
      )}
    </div>,
    document.body
  );

  return (
    <>
      {imageError ? (
        <div className={`${thumbClass} bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold`}>
          {alt.slice(0, 2).toUpperCase()}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={thumbClass}
          onMouseEnter={(e) => { setOpen(true); updatePos(e.clientX, e.clientY); }}
          onMouseMove={(e) => updatePos(e.clientX, e.clientY)}
          onMouseLeave={() => setOpen(false)}
          onClick={(e) => { setOpen(true); updatePos(e.clientX, e.clientY); }}
          onError={() => setImageError(true)}
        />
      )}
      {preview}
    </>
  );
}
