import { useEffect, useMemo, useState } from "react";
import AppLayout from "./layouts/AppLayout";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Complaints from "./pages/Complaints";
import Assignments from "./pages/Assignments";
import NotFound from "./pages/NotFound";
import { currentUser } from "./data/mockData";
import axios from "axios";

const pageMap = {
  dashboard: Dashboard,
  complaints: Complaints,
  assignments: Assignments,
};

const navItems = [
  { id: "dashboard", label: "Command Center" },
  { id: "complaints", label: "Complaints" },
  { id: "assignments", label: "Assignments" },
];

const accessRules = {
  admin: ["dashboard", "complaints", "assignments"],
  manager: ["dashboard", "complaints", "assignments"],
  responder: ["dashboard", "complaints", "assignments"],
};

const DAY_MS = 24 * 60 * 60 * 1000;

const getDayStart = (date = new Date()) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const isBetween = (value, start, end) => value >= start && value < end;

const formatDelta = (current, previous) => {
  const delta = current - previous;
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `${delta}`;
  return "0";
};

const isResolved = (complaint) => (complaint.status || "").toLowerCase().includes("resolved");

const mapComplaints = (data = []) =>
  data.map((c) => ({
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

const buildStats = (mapped) => {
  const now = new Date();
  const startOfToday = getDayStart(now);
  const startOfTomorrow = new Date(startOfToday.getTime() + DAY_MS);
  const startOfYesterday = new Date(startOfToday.getTime() - DAY_MS);
  const createdAt = (complaint) => new Date(complaint.created_at);
  const resolvedAt = (complaint) => (complaint.resolved_at ? new Date(complaint.resolved_at) : null);

  const openComplaints = mapped.filter((m) => !isResolved(m));
  const newToday = mapped.filter((m) => isBetween(createdAt(m), startOfToday, startOfTomorrow)).length;
  const newYesterday = mapped.filter((m) => isBetween(createdAt(m), startOfYesterday, startOfToday)).length;
  const resolved = mapped.filter((m) => isResolved(m)).length;
  const resolvedToday = mapped.filter((m) => {
    const value = resolvedAt(m);
    return value && isBetween(value, startOfToday, startOfTomorrow);
  }).length;
  const resolvedYesterday = mapped.filter((m) => {
    const value = resolvedAt(m);
    return value && isBetween(value, startOfYesterday, startOfToday);
  }).length;
  const overdue = openComplaints.filter((m) => now.getTime() - createdAt(m).getTime() > 3 * DAY_MS).length;

  return [
    {
      label: "New Today",
      value: newToday.toString(),
      trend: formatDelta(newToday, newYesterday),
      tone: "jade",
      detail: `vs ${newYesterday} yesterday`,
    },
    {
      label: "In Review",
      value: openComplaints.length.toString(),
      trend: null,
      tone: "sun",
      detail: "Open complaints",
    },
    {
      label: "Resolved",
      value: resolved.toString(),
      trend: formatDelta(resolvedToday, resolvedYesterday),
      tone: "jade",
      detail: `${resolvedToday} resolved today`,
    },
    {
      label: "Overdue",
      value: overdue.toString(),
      trend: null,
      tone: "coral",
      detail: "Open for more than 72 hours",
    },
  ];
};

const buildChannels = (mapped) => {
  const appTextCount = mapped.filter((c) => (c.channel || "").toLowerCase() === "app").length;
  const appVoiceCount = mapped.filter((c) => (c.channel || "").toLowerCase() === "voice").length;
  return [
    { name: "App (Text)", value: appTextCount },
    { name: "App (Voice)", value: appVoiceCount },
  ];
};

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [role, setRole] = useState(currentUser.role);
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState([]);
  const [activity, setActivity] = useState([]);
  const [channels, setChannels] = useState([]);
  const [resolvingComplaintId, setResolvingComplaintId] = useState(null);

  const loadComplaints = () => {
    return axios.get("http://localhost:5000/api/complaints").then((res) => {
      const mapped = mapComplaints(res.data?.data || []);
      setComplaints(mapped);
      setStats(buildStats(mapped));
      setChannels(buildChannels(mapped));
      setActivity([{ message: "Live dashboard active", time: "Just now" }]);
    }).catch(console.error);
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleResolveComplaint = async (complaintId) => {
    setResolvingComplaintId(complaintId);
    try {
      await axios.patch(`http://localhost:5000/api/complaints/${complaintId}/status`, {
        status: "resolved",
        actor_type: "admin",
        note: "Resolved from JANSEVA dashboard",
      });
      await loadComplaints();
    } finally {
      setResolvingComplaintId(null);
    }
  };

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
        onResolveComplaint={handleResolveComplaint}
        resolvingComplaintId={resolvingComplaintId}
        role={role}
        onRoleChange={setRole}
      />
    </AppLayout>
  );
}

export default App;
