const Settings = () => {
  return (
    <div className="card">
      <h2 className="text-2xl font-semibold text-ink-900">Operations Settings</h2>
      <p className="mt-2 text-sm text-ink-600">
        Configure departments, escalation timers, and notification rules.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-ink-900/10 p-4">
          <p className="text-sm font-semibold text-ink-900">Response SLA</p>
          <p className="mt-2 text-xs text-ink-600">Default resolution target</p>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-ink-900/5 px-4 py-3 text-sm">
            <span>24 hrs</span>
            <button type="button" className="text-xs font-semibold text-ink-700">
              Change
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-ink-900/10 p-4">
          <p className="text-sm font-semibold text-ink-900">Auto-messaging</p>
          <p className="mt-2 text-xs text-ink-600">Thank you notes + status updates</p>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-ink-900/5 px-4 py-3 text-sm">
            <span>Enabled</span>
            <button type="button" className="text-xs font-semibold text-ink-700">
              Configure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
