import { useState } from "react";

const ComplaintList = ({ items = [] }) => {
  const [selected, setSelected] = useState(null);

  const handleSelect = (item) => {
    setSelected(item);
  };

  const closeDetail = () => {
    setSelected(null);
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

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
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelect(item)}
            className="w-full cursor-pointer rounded-2xl border border-ink-900/10 bg-white p-4 text-left transition hover:border-ink-900/20 hover:bg-ink-50"
          >
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-ink-600">
                  <span className="font-semibold uppercase tracking-wide text-ink-700">
                    {item.category || "General"}
                  </span>
                  <span>{formatDate(item.created_at)}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-600">
                  <span className="rounded-full bg-ink-900/5 px-2 py-1">
                    Mode: {item.channel}
                  </span>
                  <span className="rounded-full bg-sun-400/15 px-3 py-1 text-[11px] font-semibold text-sun-600 capitalize">
                    Urgency: {item.priority}
                  </span>
                </div>

                <p className="mt-2 line-clamp-2 text-sm text-ink-800">
                  {item.translated_text || item.raw_text}
                </p>
              </div>

              <div className="flex flex-col items-end justify-between gap-2 text-[11px] text-ink-600">
                <div className="flex flex-wrap items-center gap-2">
                  {item.status && (
                    <span className="rounded-full bg-jade-400/15 px-3 py-1 text-jade-600 capitalize">
                      {item.status}
                    </span>
                  )}
                  {item.channel && <span className="chip capitalize">{item.channel}</span>}
                </div>
                {item.complaint_number && (
                  <p className="text-right text-[11px] text-ink-500">
                    #{item.complaint_number}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-500">
                  {selected.category || "Complaint"}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-ink-900">
                  Complaint #{selected.complaint_number}
                </h3>
                <p className="mt-1 text-xs text-ink-600">
                  {formatDate(selected.created_at)} · Mode: {selected.channel}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-700 hover:bg-ink-200"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-ink-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Complaint Text
                </p>
                <p className="mt-1 whitespace-pre-line">
                  {selected.translated_text || selected.raw_text || ""}
                </p>
              </div>

              <div className="grid gap-3 text-xs text-ink-700 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="font-semibold text-ink-800">Urgency</p>
                  <p className="capitalize">Dashboard: {selected.priority}</p>
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-ink-800">Metadata</p>
                  <p>ID: {selected.id}</p>
                  {selected.status && (
                    <p className="capitalize">Status: {selected.status}</p>
                  )}
                  {selected.resolved_at && (
                    <p>Resolved at: {formatDate(selected.resolved_at)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintList;
