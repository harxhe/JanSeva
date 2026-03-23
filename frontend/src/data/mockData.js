export const stats = [
  {
    label: "New Today",
    value: "128",
    trend: "+12%",
    tone: "jade",
    detail: "Across SMS and IVR",
  },
  {
    label: "In Review",
    value: "64",
    trend: "-4%",
    tone: "sun",
    detail: "Awaiting department tagging",
  },
  {
    label: "Resolved",
    value: "892",
    trend: "+22%",
    tone: "jade",
    detail: "Last 7 days",
  },
  {
    label: "Overdue",
    value: "18",
    trend: "+3",
    tone: "coral",
    detail: "SLA breaches pending",
  },
];

export const complaints = [
  {
    id: "C-1023",
    title: "Water leakage near Sector 11",
    channel: "SMS",
    priority: "High",
    ward: "Ward 21",
    time: "2 mins ago",
    status: "New",
    assignee: "Riya Nair",
    assigneeRole: "Responder",
    tags: ["Water", "Pipeline"],
    evidence: [
      {
        id: "EV-301",
        title: "Leakage photo",
        type: "Image",
        size: "2.4 MB",
      },
    ],
  },
  {
    id: "C-1022",
    title: "Street light outage in Market Road",
    channel: "SMS",
    priority: "Medium",
    ward: "Ward 08",
    time: "6 mins ago",
    status: "In Review",
    assignee: "Arjun Mehta",
    assigneeRole: "Manager",
    tags: ["Electrical"],
    evidence: [],
  },
  {
    id: "C-1021",
    title: "Garbage pile near bus stop",
    channel: "IVR",
    priority: "High",
    ward: "Ward 13",
    time: "12 mins ago",
    status: "Assigned",
    assignee: "Salma Khan",
    assigneeRole: "Responder",
    tags: ["Sanitation"],
    evidence: [
      {
        id: "EV-300",
        title: "IVR recording",
        type: "Audio",
        size: "6.1 MB",
      },
    ],
  },
  {
    id: "C-1020",
    title: "Pothole causing traffic slowdown",
    channel: "IVR",
    priority: "Medium",
    ward: "Ward 18",
    time: "18 mins ago",
    status: "Assigned",
    assignee: "Manish Rao",
    assigneeRole: "Responder",
    tags: ["Roads"],
    evidence: [
      {
        id: "EV-299",
        title: "Site photo",
        type: "Image",
        size: "3.8 MB",
      },
    ],
  },
  {
    id: "C-1019",
    title: "Blocked drain near school",
    channel: "SMS",
    priority: "Low",
    ward: "Ward 05",
    time: "22 mins ago",
    status: "Resolved",
    assignee: "Kavita Joshi",
    assigneeRole: "Responder",
    tags: ["Drainage"],
    evidence: [],
  },
];

export const activity = [
  {
    message: "Complaint C-1023 auto-tagged to Water Dept.",
    time: "1 min ago",
  },
  {
    message: "AI confidence improved to 92% for Electrical",
    time: "5 mins ago",
  },
  {
    message: "IVR transcript delivered for C-1021",
    time: "9 mins ago",
  },
  {
    message: "SMS batch classified for Drainage priority",
    time: "12 mins ago",
  },
];

export const channels = [
  { name: "SMS", value: 58 },
  { name: "IVR", value: 42 },
];

export const currentUser = {
  name: "Harsh Vardhan Singh",
  username: "24BIT0080",
  role: "admin",
  googleConnected: true,
};
