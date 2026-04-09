import { useEffect, useMemo, useState } from "react";

const STAFF_OPTIONS = [
  { id: "unassigned", name: "Unassigned", role: "Queue" },
  { id: "asha", name: "Asha Sharma", role: "Sanitation Officer" },
  { id: "ravi", name: "Ravi Kumar", role: "Field Engineer" },
  { id: "imran", name: "Imran Khan", role: "Ward Supervisor" },
  { id: "meera", name: "Meera Joshi", role: "Operations Lead" },
];

const inferDefaultAssignment = (complaint) => {
  const category = (complaint.category || "").toLowerCase();
  if (category.includes("sanitation")) return "asha";
  if (category.includes("electrical") || category.includes("water") || category.includes("roads")) return "ravi";
  if (category.includes("drainage")) return "imran";
  return "unassigned";
};

const Assignments = ({ complaints = [] }) => {
  const [assignments, setAssignments] = useState({});

  useEffect(() => {
    setAssignments((current) => {
      const next = { ...current };
      for (const complaint of complaints) {
        if (!next[complaint.id]) {
          next[complaint.id] = inferDefaultAssignment(complaint);
        }
      }
      return next;
    });
  }, [complaints]);

  const assignedComplaints = useMemo(
    () => complaints.filter((complaint) => !(complaint.status || "").toLowerCase().includes("resolved")),
    [complaints]
  );

  const workload = useMemo(() => {
    return STAFF_OPTIONS.map((staff) => ({
      ...staff,
      count: assignedComplaints.filter((complaint) => assignments[complaint.id] === staff.id).length,
    }));
  }, [assignedComplaints, assignments]);

  const getStaff = (complaintId) =>
    STAFF_OPTIONS.find((staff) => staff.id === assignments[complaintId]) || STAFF_OPTIONS[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="card">
        <h2 className="text-2xl font-semibold text-ink-900">Assignments</h2>
        <p className="mt-2 text-sm text-ink-600">
          Staff assignment board for distributing active JANSEVA complaints.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {workload.map((staff) => (
          <div key={staff.id} className="rounded-2xl border border-ink-900/10 bg-white/80 p-5 shadow-card">
            <p className="text-sm font-semibold text-ink-900">{staff.name}</p>
            <p className="mt-1 text-xs text-ink-600">{staff.role}</p>
            <p className="mt-4 text-3xl font-semibold text-ink-900">{staff.count}</p>
            <p className="mt-2 text-xs text-ink-600">Active complaints assigned</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h3 className="section-title">Assignment Queue</h3>
          <span className="rounded-full bg-ink-900/5 px-3 py-1 text-xs font-semibold text-ink-700">
            {assignedComplaints.length} open complaints
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {assignedComplaints.map((complaint) => {
            const staff = getStaff(complaint.id);
            return (
              <div
                key={complaint.id}
                className="grid gap-4 rounded-2xl border border-ink-900/10 bg-white p-4 lg:grid-cols-[1.4fr_0.9fr_220px] lg:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-600">
                    <span className="font-semibold uppercase tracking-wide text-ink-700">
                      {complaint.category || "General"}
                    </span>
                    <span className="rounded-full bg-ink-900/5 px-2 py-1 capitalize">
                      {complaint.channel}
                    </span>
                    <span className="rounded-full bg-sun-400/15 px-3 py-1 font-semibold text-sun-700 capitalize">
                      {complaint.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink-800">
                    {complaint.translated_text || complaint.raw_text}
                  </p>
                  <p className="mt-2 text-xs text-ink-500">Complaint #{complaint.complaint_number}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Assigned Staff</p>
                  <p className="mt-1 text-sm font-semibold text-ink-900">{staff.name}</p>
                  <p className="text-xs text-ink-600">{staff.role}</p>
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Assign to
                  </span>
                  <select
                    value={assignments[complaint.id] || "unassigned"}
                    onChange={(event) =>
                      setAssignments((current) => ({
                        ...current,
                        [complaint.id]: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-ink-900/10 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-ink-900/30"
                  >
                    {STAFF_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            );
          })}

          {assignedComplaints.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-900/15 bg-ink-50 px-4 py-8 text-center text-sm text-ink-600">
              No active complaints available for assignment.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Assignments;
