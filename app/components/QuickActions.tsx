import Button from "@/app/components/button";
import * as Unicons from "@iconscout/react-unicons";

interface QuickActionsProps {
  onGoLive?: () => void;
  onAnalytics?: () => void;
  onNotifyAll?: () => void;
  onSettings?: () => void;
}

export default function QuickActions({
  onGoLive,
  onAnalytics,
  onNotifyAll,
  onSettings,
}: QuickActionsProps) {
  return (
    <div className="bg-neutral-900 rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <Unicons.UilBolt size="20" className="text-lime-400" />
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <ActionButton
          icon={<Unicons.UilRss size="24" />}
          label="Go Live"
          onClick={onGoLive}
        />
        <ActionButton
          icon={<Unicons.UilAnalytics size="24" />}
          label="Analytics"
          onClick={onAnalytics}
        />
        <ActionButton
          icon={<Unicons.UilBell size="24" />}
          label="Notify All"
          onClick={onNotifyAll}
        />
        <ActionButton
          icon={<Unicons.UilSetting size="24" />}
          label="Settings"
          onClick={onSettings}
        />
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Button
      variant="outline"
      className="h-auto py-3 flex flex-col items-center justify-center"
      onClick={onClick}
    >
      <div className="mb-2">{icon}</div>
      <span className="text-sm">{label}</span>
    </Button>
  );
}
