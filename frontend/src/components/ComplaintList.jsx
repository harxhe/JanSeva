const ComplaintList = ({ items }) => {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Live Complaints</h2>
        <button type="button" className="btn btn-outline">
          View all
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-ink-900/10 bg-white p-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                <p className="text-xs text-ink-600">
                  {item.id} · {item.ward} · {item.time}
                </p>
                <p className="mt-2 text-xs text-ink-600">
                  Assigned to {item.assignee} · {item.assigneeRole}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="chip">{item.channel}</span>
                <span className="rounded-full bg-sun-400/20 px-3 py-1 text-sun-500">
                  {item.priority}
                </span>
                <span className="rounded-full bg-jade-400/15 px-3 py-1 text-jade-600">
                  {item.status}
                </span>
                <span className="chip">{item.evidence.length} evidence</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-ink-600">
              {item.tags.map((tag) => (
                <span key={`${item.id}-${tag}`} className="rounded-full bg-ink-900/5 px-2 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComplaintList;
