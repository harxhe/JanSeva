import { useEffect, useMemo, useState } from "react";
import AppLayout from "./layouts/AppLayout";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Complaints from "./pages/Complaints";
import NotFound from "./pages/NotFound";
import { stats, complaints, activity, channels, currentUser } from "./data/mockData";

const pageMap = {
  dashboard: Dashboard,
  complaints: Complaints,
};

const navItems = [
  { id: "dashboard", label: "Command Center" },
  { id: "complaints", label: "Complaints" },
];

const accessRules = {
  admin: ["dashboard", "complaints"],
  manager: ["dashboard", "complaints"],
  responder: ["dashboard", "complaints"],
};

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [role, setRole] = useState(currentUser.role);

  const allowedPages = accessRules[role] || [];
  const visibleNav = navItems.filter((item) => allowedPages.includes(item.id));
  const ActivePage = useMemo(() => {
    if (!allowedPages.includes(activePage)) {
      return NotFound;
    }
    return pageMap[activePage] || NotFound;
  }, [activePage, allowedPages]);

  useEffect(() => {
    if (!allowedPages.includes(activePage) && allowedPages.length > 0) {
      setActivePage(allowedPages[0]);
    }
  }, [activePage, allowedPages]);

  return (
    <AppLayout
      sidebar={
        <Sidebar
          activeId={activePage}
          onChange={setActivePage}
          navItems={visibleNav}
          user={{ ...currentUser, role }}
        />
      }
    >
      <ActivePage
        stats={stats}
        complaints={complaints}
        activity={activity}
        channels={channels}
        role={role}
        onRoleChange={setRole}
      />
    </AppLayout>
  );
}

export default App;
