import StatCard from "../components/StatCard";
import ComplaintList from "../components/ComplaintList";
import ActivityFeed from "../components/ActivityFeed";
import TopBar from "../components/TopBar";

const Dashboard = ({ stats, complaints, activity, channels, role, onRoleChange }) => {
  return (
    <div className="flex flex-col gap-6">
      <TopBar role={role} onRoleChange={onRoleChange} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <ComplaintList items={complaints} />
        <div className="flex flex-col gap-6">
          <div className="card">
            <h3 className="section-title">Channel Mix</h3>
            <p className="section-subtitle">Live distribution of inputs.</p>
            <div className="mt-4 space-y-3">
              {channels.map((channel) => (
                <div key={channel.name}>
                  <div className="flex items-center justify-between text-xs text-ink-600">
                    <span>{channel.name}</span>
                    <span>{channel.value}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-ink-900/5">
                    <div
                      className="h-2 rounded-full bg-ink-900"
                      style={{ width: `${channel.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <ActivityFeed items={activity} />
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
