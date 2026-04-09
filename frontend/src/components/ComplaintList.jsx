import { useEffect, useMemo, useState } from "react";

const ComplaintList = ({ items = [], onResolveComplaint, resolvingComplaintId }) => {
  const [selected, setSelected] = useState(null);
  const [activeFilter, setActiveFilter] = useState("unresolved");

  const DAY_MS = 24 * 60 * 60 * 1000;

  const handleSelect = (item) => {
    setSelected(item);
  };

  const closeDetail = () => {
    setSelected(null);
  };

  const isResolved = (item) => (item.status || "").toLowerCase().includes("resolved");
  const isNew = (item) => {
    if (!item?.created_at) return false;
    const createdAt = new Date(item.created_at);
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday.getTime() + DAY_MS);
    return createdAt >= startOfToday && createdAt < startOfTomorrow;
  };
  const isOverdue = (item) => {
    if (!item?.created_at || isResolved(item)) return false;
    return Date.now() - new Date(item.created_at).getTime() > 3 * DAY_MS;
  };

  const filterButtons = useMemo(() => {
    const unresolvedCount = items.filter((item) => !isResolved(item)).length;
    const solvedCount = items.filter((item) => isResolved(item)).length;
    const newCount = items.filter((item) => isNew(item)).length;
    const overdueCount = items.filter((item) => isOverdue(item)).length;

    return [
      { id: "all", label: "View all", count: items.length },
      { id: "unresolved", label: "Unresolved", count: unresolvedCount },
      { id: "solved", label: "Solved", count: solvedCount },
      { id: "new", label: "New", count: newCount },
      { id: "overdue", label: "Overdue", count: overdueCount },
    ];
  }, [items]);

  const filteredItems = useMemo(() => {
    switch (activeFilter) {
      case "solved":
        return items.filter((item) => isResolved(item));
      case "new":
        return items.filter((item) => isNew(item));
      case "overdue":
        return items.filter((item) => isOverdue(item));
      case "unresolved":
        return items.filter((item) => !isResolved(item));
      case "all":
      default:
        return items;
    }
  }, [activeFilter, items]);

  useEffect(() => {
    if (!selected) return;
    const nextSelected = items.find((item) => item.id === selected.id);
    if (!nextSelected) {
      setSelected(null);
      return;
    }
    setSelected(nextSelected);
  }, [items, selected]);

  const getStatusClasses = (item) => {
    if (isResolved(item)) {
      return "bg-jade-400/15 text-jade-700";
    }
    if (isOverdue(item)) {
      return "bg-coral-500/15 text-coral-600";
    }
    if (isNew(item)) {
      return "bg-sun-400/20 text-sun-700";
    }
    return "bg-ink-900/8 text-ink-700";
  };

  const getStateLabels = (item) => {
    const labels = [];
    if (isResolved(item)) {
      labels.push({ text: "Solved", className: "bg-jade-400/15 text-jade-700" });
    } else {
      labels.push({ text: "Unresolved", className: "bg-ink-900/8 text-ink-700" });
    }

    if (isOverdue(item)) {
      labels.push({ text: "Overdue", className: "bg-coral-500/15 text-coral-600" });
    } else if (isNew(item)) {
      labels.push({ text: "New", className: "bg-sun-400/20 text-sun-700" });
    }

    return labels;
  };

  const handleResolve = async () => {
    if (!selected || !onResolveComplaint || isResolved(selected)) return;
    await onResolveComplaint(selected.id);
    setSelected((current) =>
      current ? { ...current, status: "resolved", resolved_at: new Date().toISOString() } : current
    );
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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="section-title">Live Complaints</h2>
        <div className="flex flex-wrap gap-2">
          {filterButtons.map((filter) => {
            const active = filter.id === activeFilter;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                  active
                    ? "border-ink-900 bg-ink-900 text-white"
                    : "border-ink-900/10 bg-white text-ink-700 hover:border-ink-900/20 hover:bg-ink-50"
                }`}
              >
                {filter.label} <span className="ml-1 opacity-80">{filter.count}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {filteredItems.map((item) => (
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
                  {getStateLabels(item).map((label) => (
                    <span
                      key={`${item.id}-${label.text}`}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${label.className}`}
                    >
                      {label.text}
                    </span>
                  ))}
                </div>

                <p className="mt-2 line-clamp-2 text-sm text-ink-800">
                  {item.translated_text || item.raw_text}
                </p>
              </div>

              <div className="flex flex-col items-end justify-between gap-2 text-[11px] text-ink-600">
                <div className="flex flex-wrap items-center gap-2">
                  {item.status && (
                    <span className={`rounded-full px-3 py-1 capitalize ${getStatusClasses(item)}`}>
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
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-900/15 bg-ink-50 px-4 py-8 text-center text-sm text-ink-600">
            No complaints in this category.
          </div>
        ) : null}
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

              <div className="flex justify-end gap-3 pt-2">
                {!isResolved(selected) && onResolveComplaint ? (
                  <button
                    type="button"
                    onClick={handleResolve}
                    disabled={resolvingComplaintId === selected.id}
                    className="rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resolvingComplaintId === selected.id ? "Marking resolved..." : "Mark as resolved"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintList;
