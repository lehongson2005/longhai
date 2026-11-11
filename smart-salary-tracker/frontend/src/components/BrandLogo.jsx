export default function BrandLogo({ dark = false, compact = false }) {
  return (
    <div className="flex items-center gap-3 select-none">
      {/* Securitas-inspired 3 red dots + protective badge */}
      <div className={`flex items-center justify-center rounded-lg px-2.5 py-2 ${dark ? 'bg-white/10 border border-white/15' : 'bg-[#0A192F]'}`}>
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E30613]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E30613]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E30613]" />
        </div>
      </div>
      <div className="leading-tight">
        <div className={`font-extrabold tracking-tight ${compact ? 'text-base' : 'text-lg'} ${dark ? 'text-white' : 'text-[#0A192F]'}`}>
          LONG HẢI <span className="text-[#E30613]">SECURITAS</span>
        </div>
        {!compact && (
          <div className={`text-[11px] font-medium tracking-wide uppercase ${dark ? 'text-slate-300' : 'text-slate-500'}`}>
            An ninh chuyên nghiệp từ 1995
          </div>
        )}
      </div>
    </div>
  );
}
