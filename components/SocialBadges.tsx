import { Globe, Send, Gamepad2, Flame, BarChart3, Landmark, ExternalLink, X } from "lucide-react";

type Props = { 
  links?: {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
    pumpfun?: string;
    dexscreener?: string;
    jupiter?: string;
    explorer?: string;
  };
};

const A: React.FC<{href?: string; title: string; children: React.ReactNode}> = ({ href, title, children }) => {
  // Always render the icon, but make it non-clickable if no href
  if (!href) {
    return (
      <div
        className="inline-flex items-center justify-center rounded-md h-7 w-7 bg-white/5 text-white/30 cursor-default"
        title={`${title} - Not available`}
        aria-label={`${title} - Not available`}
      >
        {children}
      </div>
    );
  }
  
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center rounded-md h-7 w-7 bg-white/5 hover:bg-white/10 transition-colors duration-200"
      title={title}
      aria-label={title}
    >
      {children}
    </a>
  );
};

export default function SocialBadges({ links }: Props) {
  // Always render all social badges, even if links are undefined
  // This ensures they appear immediately on page load
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <A href={links?.website}     title="Website"><Globe size={14} className="text-white/80" /></A>
      <A href={links?.twitter}     title="X (Twitter)"><X size={14} className="text-white/80" /></A>
      <A href={links?.telegram}    title="Telegram"><Send size={14} className="text-white/80" /></A>
      <A href={links?.discord}     title="Discord"><Gamepad2 size={14} className="text-white/80" /></A>
      <A href={links?.pumpfun}     title="Pump.fun"><Flame size={14} className="text-white/80" /></A>
      <A href={links?.dexscreener} title="DexScreener"><BarChart3 size={14} className="text-white/80" /></A>
      <A href={links?.explorer}    title="Solscan"><Landmark size={14} className="text-white/80" /></A>
      <A href={links?.jupiter}     title="Trade on Jupiter"><ExternalLink size={14} className="text-white/80" /></A>
    </div>
  );
}
