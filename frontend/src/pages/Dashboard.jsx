import StatCard from "../components/StatCard";
import ComplaintList from "../components/ComplaintList";
import TopBar from "../components/TopBar";

const Dashboard = ({ stats, complaints, role, onRoleChange }) => {
  return (
    <div className="flex flex-col gap-6">
      <TopBar role={role} onRoleChange={onRoleChange} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>
      <section className="grid gap-6">
        <ComplaintList items={complaints} />
      </section>
    </div>
  );
};

export default Dashboard;
