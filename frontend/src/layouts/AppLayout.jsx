const AppLayout = ({ sidebar, children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7ff] via-[#eef3ff] to-[#fdf7f1]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[280px_1fr]">
        <div className="h-full">{sidebar}</div>
        <main className="flex flex-col gap-6">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
