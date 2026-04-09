import ComplaintList from "../components/ComplaintList";

const Complaints = ({ complaints, onResolveComplaint, resolvingComplaintId }) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="card">
        <h2 className="text-2xl font-semibold text-ink-900">Complaint Inbox</h2>
        <p className="mt-2 text-sm text-ink-600">
          AI-prioritized cases ready for review and assignment.
        </p>
      </div>
      <div className="grid gap-6">
        <ComplaintList
          items={complaints}
          onResolveComplaint={onResolveComplaint}
          resolvingComplaintId={resolvingComplaintId}
        />
      </div>
    </div>
  );
};

export default Complaints;
