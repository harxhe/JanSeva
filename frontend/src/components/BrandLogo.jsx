const BrandLogo = ({ compact = false, light = false }) => {
  const textTone = light ? "text-white" : "text-ink-900";
  const subTone = light ? "text-white/65" : "text-ink-600";

  return (
    <div className={`flex items-center ${compact ? "gap-3" : "gap-4"}`}>
      <div
        className={`relative flex items-center justify-center overflow-hidden ${compact ? "h-10 w-10 rounded-2xl" : "h-14 w-14 rounded-[20px]"} ${light ? "border border-white/15 bg-white/10" : "bg-ink-900"}`}
      >
        <div className="absolute top-2 h-6 w-6 rounded-full border-2 border-white" />
        <div className="absolute bottom-2 h-5 w-1 rounded-full bg-white" />
        <div className="absolute bottom-3 left-2.5 h-2 w-3 -rotate-[30deg] rounded-full bg-mint-500" />
        <div className="absolute bottom-3 right-2.5 h-2 w-3 rotate-[30deg] rounded-full bg-amber-400" />
      </div>
      <div>
        <p className={`${compact ? "text-lg" : "text-2xl"} font-semibold tracking-[0.18em] ${textTone}`}>JANSEVA</p>
        {!compact ? <p className={`text-xs tracking-[0.12em] ${subTone}`}>Citizen Complaint Platform</p> : null}
      </div>
    </div>
  );
};

export default BrandLogo;
