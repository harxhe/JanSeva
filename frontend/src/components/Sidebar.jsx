const Sidebar = ({ activeId, onChange, navItems}) => {
  return (
    <aside className="flex h-full flex-col gap-6 rounded-3xl bg-ink-900/95 p-6 text-white shadow-soft">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Samadhan</p>
        <h1 className="mt-2 text-2xl font-semibold">Civic Command Hub</h1>
        <p className="mt-2 text-sm text-white/70">
          Dashboard for Civic Complaints.
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

    </aside>
  );
};

export default Sidebar;
