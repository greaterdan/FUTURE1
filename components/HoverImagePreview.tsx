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
    const w = 250, h = 250; // rough bounds incl. padding (reduced from 500)
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
      <img
        src={src}
        alt={alt}
        className="max-w-[240px] max-h-[240px] object-contain rounded-lg"
        draggable={false}
      />
    </div>,
    document.body
  );

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={thumbClass}
        onMouseEnter={(e) => { setOpen(true); updatePos(e.clientX, e.clientY); }}
        onMouseMove={(e) => updatePos(e.clientX, e.clientY)}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => { setOpen(true); updatePos(e.clientX, e.clientY); }}
      />
      {preview}
    </>
  );
}
