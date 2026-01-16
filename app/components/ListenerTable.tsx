// app/admin/components/ListenerTable.tsx
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

interface ListenerTableProps {
  listeners: Listener[];
  searchTerm: string;
  selectedListener: Listener | null;
  onSearch: (term: string) => void;
  onSelectListener: (listener: Listener) => void;
  onToggleStatus: (id: string) => void;
}

export default function ListenerTable({
  listeners,
  searchTerm,
  selectedListener,
  onSearch,
  onSelectListener,
  onToggleStatus,
}: ListenerTableProps) {
  return (
    <div className="bg-neutral-900 rounded-2xl p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Unicons.UilUserSquare size="24" className="text-lime-400" />
          Listener Management
        </h2>

        <div className="relative">
          <Unicons.UilSearch
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500"
            size="20"
          />
          <input
            type="text"
            placeholder="Search listeners..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-full text-sm w-64 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="text-left py-3 px-2 text-sm font-medium text-neutral-400">
                Name
              </th>
              <th className="text-left py-3 px-2 text-sm font-medium text-neutral-400">
                Status
              </th>
              <th className="text-left py-3 px-2 text-sm font-medium text-neutral-400">
                Episodes
              </th>
              <th className="text-left py-3 px-2 text-sm font-medium text-neutral-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {listeners.map((listener) => (
              <ListenerRow
                key={listener.id}
                listener={listener}
                isSelected={selectedListener?.id === listener.id}
                onSelect={() => onSelectListener(listener)}
                onToggleStatus={() => onToggleStatus(listener.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-neutral-500">
          Showing {listeners.length} listeners
        </p>
        <button className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm transition-colors">
          Export List
        </button>
      </div>
    </div>
  );
}

function ListenerRow({
  listener,
  isSelected,
  onSelect,
  onToggleStatus,
}: {
  listener: Listener;
  isSelected: boolean;
  onSelect: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <tr
      className={`border-b border-neutral-800 hover:bg-neutral-800/30 ${
        isSelected ? "bg-neutral-800/50" : ""
      }`}
      onClick={onSelect}
    >
      <td className="py-3 px-2">
        <div>
          <p className="font-medium">{listener.name}</p>
          <p className="text-sm text-neutral-500">{listener.email}</p>
        </div>
      </td>
      <td className="py-3 px-2">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            listener.status === "active"
              ? "bg-green-400/20 text-green-400"
              : "bg-red-400/20 text-red-400"
          }`}
        >
          {listener.status === "active" ? (
            <>
              <Unicons.UilCheckCircle size="12" className="mr-1" />
              Active
            </>
          ) : (
            <>
              <Unicons.UilTimesCircle size="12" className="mr-1" />
              Inactive
            </>
          )}
        </span>
      </td>
      <td className="py-3 px-2">
        <div>
          <p className="text-sm">{listener.episodesCompleted} completed</p>
          <p className="text-xs text-neutral-500">{listener.totalTime}</p>
        </div>
      </td>
      <td className="py-3 px-2">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus();
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              listener.status === "active"
                ? "text-red-400 hover:bg-red-400/20"
                : "text-green-400 hover:bg-green-400/20"
            }`}
          >
            {listener.status === "active" ? (
              <Unicons.UilUserMinus size="16" />
            ) : (
              <Unicons.UilUserPlus size="16" />
            )}
          </button>
          <button className="p-1.5 text-neutral-400 hover:text-lime-400 hover:bg-lime-400/20 rounded-lg transition-colors">
            <Unicons.UilEnvelope size="16" />
          </button>
          <button className="p-1.5 text-neutral-400 hover:text-neutral-300 hover:bg-neutral-700 rounded-lg transition-colors">
            <Unicons.UilEye size="16" />
          </button>
        </div>
      </td>
    </tr>
  );
}
