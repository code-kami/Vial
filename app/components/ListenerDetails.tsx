import Button from "@/app/components/button";
import * as Unicons from "@iconscout/react-unicons";

interface Listener {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  status: "active" | "inactive";
  episodesCompleted: number;
  totalTime: string;
}

interface ListenerDetailsProps {
  listener: Listener;
  onClose: () => void;
  onSendMessage: () => void;
}

export default function ListenerDetails({
  listener,
  onClose,
  onSendMessage,
}: ListenerDetailsProps) {
  return (
    <div className="bg-neutral-900 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Unicons.UilUserCircle size="20" className="text-lime-400" />
          Listener Details
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800 rounded-lg"
        >
          <Unicons.UilTimes size="18" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-linear-to-br from-lime-400 to-emerald-500 flex items-center justify-center">
            <span className="font-bold text-black text-xl">
              {listener.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
          <div>
            <h4 className="text-xl font-semibold">{listener.name}</h4>
            <p className="text-neutral-400">{listener.email}</p>
            <p className="text-sm text-neutral-500 mt-1">
              Member since{" "}
              {new Date(listener.joinDate).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
          <div className="text-center p-3 bg-neutral-800 rounded-xl">
            <p className="text-2xl font-semibold text-lime-400">
              {listener.episodesCompleted}
            </p>
            <p className="text-sm text-neutral-400">Episodes Completed</p>
          </div>
          <div className="text-center p-3 bg-neutral-800 rounded-xl">
            <p className="text-2xl font-semibold text-lime-400">
              {listener.totalTime}
            </p>
            <p className="text-sm text-neutral-400">Total Listening Time</p>
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-800">
          <h4 className="font-medium mb-3">Recent Activity</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">Last active</span>
              <span className="text-neutral-300">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">Favorite topic</span>
              <span className="text-lime-400">Inner Order</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">Completion rate</span>
              <span className="text-neutral-300">78%</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            className="flex-1 bg-lime-400 text-black hover:bg-lime-300"
            onClick={onSendMessage}
          >
            <Unicons.UilEnvelope size="16" className="mr-2" />
            Send Message
          </Button>
          <Button variant="outline" className="flex-1">
            View Full History
          </Button>
        </div>
      </div>
    </div>
  );
}
