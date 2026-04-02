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
      const mapped = data.map((c) => ({
        id: c.id,
        complaint_number: c.complaint_number,
        title:
          c.category ||
          c.raw_text?.slice(0, 60) ||
          `Complaint ${c.complaint_number || ""}`.trim(),
        category: c.category,
        channel: c.channel,
        priority: c.priority,
        status: c.status,
        created_at: c.created_at,
        resolved_at: c.resolved_at,
        raw_text: c.raw_text,
        translated_text: c.translated_text,
        ward_id: c.ward_id,
        location_text: c.location_text,
        evidence: Array.isArray(c.media) ? c.media : [],
      }));
      setComplaints(mapped);

      const resolved = mapped.filter((m) => (m.status || "").toLowerCase().includes("resolved")).length;
      const inReview = mapped.filter((m) => {
        const status = (m.status || "").toLowerCase();
        return status && !status.includes("resolved") && status !== "received";
      }).length;
      const newToday = mapped.filter((m) => {
        const status = (m.status || "").toLowerCase();
        return status === "new" || status === "received";
      }).length;

      setStats([
        { label: "New Today", value: newToday.toString(), trend: "+0%", tone: "jade", detail: "Active issues" },
        { label: "In Review", value: inReview.toString(), trend: "-0%", tone: "sun", detail: "Awaiting resolution" },
        { label: "Resolved", value: resolved.toString(), trend: "+0%", tone: "jade", detail: "Total resolved" },
        { label: "Overdue", value: "0", trend: "0", tone: "coral", detail: "SLA breaches" },
      ]);

      setActivity([
         { message: "Live dashboard active", time: "Just now" }
      ]);

      const appTextCount = mapped.filter((c) => (c.channel || "").toLowerCase() === "app").length;
      const appVoiceCount = mapped.filter((c) => (c.channel || "").toLowerCase() === "voice").length;
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
