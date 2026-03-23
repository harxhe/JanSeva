const StatCard = ({ label, value, trend, detail, tone }) => {
  const toneClasses = {
    jade: "border-jade-400/40 bg-jade-400/10 text-jade-600",
    sun: "border-sun-400/40 bg-sun-400/10 text-sun-500",
    coral: "border-coral-500/40 bg-coral-500/10 text-coral-500",
  };

  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-600">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-ink-900">{value}</p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            toneClasses[tone] || toneClasses.jade
          }`}
        >
          {trend}
        </span>
      </div>
      <p className="mt-3 text-xs text-ink-600">{detail}</p>
    </div>
  );
};

export default StatCard;
