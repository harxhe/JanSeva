const TopBar = ({ role, onRoleChange }) => {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-600">
          Command Center
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-ink-900">
          Citizen Issue Control
        </h2>
        <p className="mt-2 text-sm text-ink-600">
          Real-time triage for SMS and IVR complaints.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-ink-900/10 bg-white px-2 py-1 text-xs font-semibold text-ink-700">
          {[
            { id: "admin", label: "Admin" },
            { id: "manager", label: "Manager" },
            { id: "responder", label: "Responder" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onRoleChange(item.id)}
              className={`rounded-full px-3 py-1 transition ${
                role === item.id ? "bg-ink-900 text-white" : "text-ink-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-outline">
          Export log
        </button>
        <button type="button" className="btn btn-primary">
          New broadcast
        </button>
      </div>
    </div>
  );
};

export default TopBar;
