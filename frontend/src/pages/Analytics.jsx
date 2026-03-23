const Analytics = () => {
  const insights = [
    {
      title: "Auto-routing accuracy",
      value: "92%",
      detail: "Water and Electrical categories improved",
    },
    {
      title: "Average response time",
      value: "23 mins",
      detail: "Target: under 30 mins",
    },
    {
      title: "Voice-to-text latency",
      value: "18s",
      detail: "Whisper processing speed",
    },
  ];

  return (
    <div className="card">
      <h2 className="text-2xl font-semibold text-ink-900">AI Insights</h2>
      <p className="mt-2 text-sm text-ink-600">
        Live diagnostics for NLP categorization and ASR throughput.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {insights.map((item) => (
          <div key={item.title} className="rounded-2xl border border-ink-900/10 p-4">
            <p className="text-sm text-ink-600">{item.title}</p>
            <p className="mt-3 text-2xl font-semibold text-ink-900">{item.value}</p>
            <p className="mt-2 text-xs text-ink-600">{item.detail}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl bg-ink-900 p-5 text-white">
        <p className="text-sm font-semibold">Next automation targets</p>
        <ul className="mt-3 space-y-2 text-xs text-white/70">
          <li>District-specific language packs for IVR.</li>
          <li>Auto-followup reminders for unresolved cases.</li>
          <li>Confidence gating for high impact incidents.</li>
        </ul>
      </div>
    </div>
  );
};

export default Analytics;
