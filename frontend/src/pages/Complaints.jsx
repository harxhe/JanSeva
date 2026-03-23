import ComplaintList from "../components/ComplaintList";

const Complaints = ({ complaints }) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="card">
        <h2 className="text-2xl font-semibold text-ink-900">Complaint Inbox</h2>
        <p className="mt-2 text-sm text-ink-600">
          AI-prioritized cases ready for review and assignment.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <ComplaintList items={complaints} />
        <div className="card">
          <h3 className="section-title">Evidence + Complaints</h3>
          <p className="section-subtitle">
            Evidence is grouped with each complaint for quick review.
          </p>
          <div className="mt-4 space-y-4">
            {complaints.map((item) => (
              <div key={item.id} className="rounded-2xl border border-ink-900/10 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-900">{item.id}</p>
                  <span className="text-xs text-ink-600">{item.evidence.length} files</span>
                </div>
                <p className="mt-2 text-xs text-ink-600">{item.title}</p>
                <div className="mt-3 space-y-2">
                  {item.evidence.length === 0 ? (
                    <p className="text-xs text-ink-600">No evidence attached yet.</p>
                  ) : (
                    item.evidence.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between rounded-xl bg-ink-900/5 px-3 py-2 text-xs"
                      >
                        <span>{file.title}</span>
                        <span className="text-ink-600">
                          {file.type} · {file.size}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Complaints;
