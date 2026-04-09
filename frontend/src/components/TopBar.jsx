const TopBar = ({ role, onRoleChange }) => {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 pl-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-600">
          Command Center
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-ink-900">
          Citizen Issue Control
        </h2>
        <p className="mt-2 text-sm text-ink-600">
          Real-time triage for citizen app complaints.
        </p>
      </div>
    </div>
  );
};

export default TopBar;
