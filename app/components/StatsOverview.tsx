import * as Unicons from "@iconscout/react-unicons";

interface StatsOverviewProps {
  stats: {
    totalListeners: number;
    activeListeners: number;
    totalEpisodes: number;
    totalListens: number;
    avgCompletionRate: string;
  };
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        title="Total Listeners"
        value={stats.totalListeners.toLocaleString()}
        icon={<Unicons.UilUsersAlt size="24" className="text-lime-400" />}
        trend="+12%"
        subtext="from last month"
      />

      <StatCard
        title="Active Listeners"
        value={stats.activeListeners.toLocaleString()}
        icon={<Unicons.UilUserCheck size="24" className="text-lime-400" />}
        trend={stats.avgCompletionRate}
        subtext="completion rate"
      />

      <StatCard
        title="Total Episodes"
        value={stats.totalEpisodes.toString()}
        icon={<Unicons.UilMicrophone size="24" className="text-lime-400" />}
        icon2={<Unicons.UilHeadphones size="16" className="text-neutral-400" />}
        subtext={`${stats.totalListens.toLocaleString()} listens`}
      />

      <StatCard
        title="Engagement Score"
        value="8.7/10"
        icon={<Unicons.UilChartBar size="24" className="text-lime-400" />}
        trend="+0.3"
        subtext="this week"
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  icon2,
  trend,
  subtext,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  icon2?: React.ReactNode;
  trend?: string;
  subtext?: string;
}) {
  return (
    <div className="bg-neutral-900 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-400">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        {icon}
      </div>
      <div className="flex items-center gap-2 mt-2 text-sm">
        {trend && (
          <>
            <Unicons.UilArrowUp size="16" className="text-green-400" />
            <span className="text-green-400">{trend}</span>
          </>
        )}
        {icon2 && icon2}
        {subtext && <span className="text-neutral-500">{subtext}</span>}
      </div>
    </div>
  );
}
