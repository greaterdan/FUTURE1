import { Globe, Send, Gamepad2, Flame, BarChart3, Landmark, ExternalLink, X, MessageCircle } from "lucide-react";

type Props = { 
  links?: {
    dexscreener?: string;
    jupiter?: string;
    explorer?: string;
  };
  // Social media links from token metadata
  website?: string;
  twitter?: string;
  telegram?: string;
  source?: string;
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

export default function SocialBadges({ links, website, twitter, telegram, source }: Props) {
  // Helper function to get source platform URL
  const getSourceUrl = (source: string, mint: string) => {
    // Check if it's a pump.fun token (mint ends with 'pump' or source is pump.fun)
    if (source === 'pump.fun' || mint.endsWith('pump')) {
      return `https://pump.fun/coin/${mint}`;
    }
    // Check if it's a bonk.fun token
    if (source === 'bonk.fun' || mint.endsWith('bonk')) {
      return `https://bonk.fun/token/${mint}`;
    }
    return null;
  };

  // Helper function to get source platform icon
  const getSourceIcon = (source: string, mint: string) => {
    // Check if it's a pump.fun token (mint ends with 'pump' or source is pump.fun)
    if (source === 'pump.fun' || mint.endsWith('pump')) {
      return <Flame size={14} className="text-orange-400" />;
    }
    // Check if it's a bonk.fun token
    if (source === 'bonk.fun' || mint.endsWith('bonk')) {
      return <Gamepad2 size={14} className="text-yellow-400" />;
    }
    return <ExternalLink size={14} className="text-white/80" />;
  };

  // Get mint from links (we'll need to pass this from the parent component)
  const mint = links?.dexscreener?.split('/').pop() || '';

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Social Media Links from Metadata */}
      {website && (
        <A href={website} title="Website">
          <Globe size={14} className="text-blue-400" />
        </A>
      )}
      {twitter && (
        <A href={twitter} title="Twitter/X">
          <X size={14} className="text-white/80" />
        </A>
      )}
      {telegram && (
        <A href={telegram} title="Telegram">
          <MessageCircle size={14} className="text-blue-500" />
        </A>
      )}
      
      {/* Source Platform */}
      {(source || mint.endsWith('pump') || mint.endsWith('bonk')) && (
        <A href={getSourceUrl(source, mint)} title={`View on ${source || (mint.endsWith('pump') ? 'pump.fun' : 'bonk.fun')}`}>
          {getSourceIcon(source, mint)}
        </A>
      )}
      
      {/* Trading Links */}
      <A href={links?.explorer} title="Solscan">
        <Landmark size={14} className="text-white/80" />
      </A>
    </div>
  );
}
