const ActivityFeed = ({ items }) => {
  return (
    <div className="card-dark">
      <h3 className="text-lg font-semibold">AI + Ops Feed</h3>
      <p className="mt-1 text-xs text-white/60">
        Automated actions from speech-to-text and priority routing.
      </p>
      <div className="mt-4 space-y-4">
        {items.map((item, index) => (
          <div key={`${item.time}-${index}`} className="rounded-2xl bg-white/5 p-3">
            <p className="text-sm">{item.message}</p>
            <p className="mt-2 text-xs text-white/60">{item.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
