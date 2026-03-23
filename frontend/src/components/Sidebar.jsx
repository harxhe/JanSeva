const Sidebar = ({ activeId, onChange, navItems, user }) => {
  return (
    <aside className="flex h-full flex-col gap-6 rounded-3xl bg-ink-900/95 p-6 text-white shadow-soft">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Samadhan</p>
        <h1 className="mt-2 text-2xl font-semibold">Civic Command Hub</h1>
        <p className="mt-2 text-sm text-white/70">
          Unified dashboard for SMS and IVR complaints.
        </p>
      </div>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
              activeId === item.id
                ? "bg-white/10 text-white"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="rounded-2xl bg-white/10 p-4 text-sm">
        <p className="text-white/70">Live SLA Watch</p>
        <p className="mt-2 text-2xl font-semibold">18 overdue</p>
        <p className="mt-2 text-white/60">Auto reminders sent every 2 hrs.</p>
      </div>
      <div className="rounded-2xl bg-white/10 p-4 text-sm">
        <p className="text-white/70">Profile</p>
        <p className="mt-2 text-base font-semibold">{user.name}</p>
        <p className="text-xs text-white/60">@{user.username}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-white/15 px-3 py-1">
            Role: {user.role}
          </span>
          <span
            className={`rounded-full px-3 py-1 ${
              user.googleConnected
                ? "bg-jade-400/20 text-jade-400"
                : "bg-sun-400/20 text-sun-400"
            }`}
          >
            Google {user.googleConnected ? "Connected" : "Not linked"}
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
