const AppLayout = ({ sidebar, children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7ff] via-[#eef3ff] to-[#fdf7f1]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <div className="lg:sticky lg:top-0 lg:h-screen">{sidebar}</div>
        <main className="flex min-h-screen flex-col gap-6">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
