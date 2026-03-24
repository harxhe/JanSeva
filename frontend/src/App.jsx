import { useEffect, useMemo, useState } from "react";
import AppLayout from "./layouts/AppLayout";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Complaints from "./pages/Complaints";
import NotFound from "./pages/NotFound";
import { currentUser } from "./data/mockData";
import axios from "axios";

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
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState([]);
  const [activity, setActivity] = useState([]);
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/complaints").then((res) => {
      const data = res.data?.data || [];
      const mapped = data.map(c => ({
        id: c.complaint_number || c.id,
        rawId: c.id,
        title: c.category || "Issue Reported",
        channel: (c.channel || "app").toUpperCase(),
        priority: (c.priority || "Medium").charAt(0).toUpperCase() + (c.priority || "Medium").slice(1),
        ward: c.ward_id ? `Ward ${c.ward_id}` : "Unassigned",
        time: new Date(c.created_at).toLocaleString(),
        status: (c.status || "New").replace("_", " "),
        assignee: "Unassigned",
        assigneeRole: "Responder",
        tags: [c.category || "General"],
        evidence: []
      }));
      setComplaints(mapped);

      const resolved = mapped.filter(m => m.status.toLowerCase().includes("resolved")).length;
      const inReview = mapped.filter(m => !m.status.toLowerCase().includes("resolved") && m.status !== "new").length;
      const newToday = mapped.filter(m => m.status.toLowerCase() === "new" || m.status.toLowerCase() === "received").length;

      setStats([
        { label: "New Today", value: newToday.toString(), trend: "+0%", tone: "jade", detail: "Active issues" },
        { label: "In Review", value: inReview.toString(), trend: "-0%", tone: "sun", detail: "Awaiting resolution" },
        { label: "Resolved", value: resolved.toString(), trend: "+0%", tone: "jade", detail: "Total resolved" },
        { label: "Overdue", value: "0", trend: "0", tone: "coral", detail: "SLA breaches" },
      ]);

      setActivity([
         { message: "Live dashboard active", time: "Just now" }
      ]);

      const appTextCount = mapped.filter(c => c.channel === "APP" && !c.title.toLowerCase().includes("voice")).length;
      const appVoiceCount = mapped.filter(c => c.channel === "APP" && c.title.toLowerCase().includes("voice")).length;
      setChannels([
        { name: "App (Text)", value: appTextCount },
        { name: "App (Voice)", value: appVoiceCount }
      ]);
    }).catch(console.error);
  }, []);

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
