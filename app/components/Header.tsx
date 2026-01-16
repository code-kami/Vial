import Button from "@/app/components/button";
import * as Unicons from "@iconscout/react-unicons";

interface HeaderProps {
  onPrint: () => void;
  onQuickUpload: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function Header({
  onPrint,
  onQuickUpload,
  onRefresh,
  isRefreshing = false,
}: HeaderProps) {
  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
      <div>
        <h1 className="text-2xl font-light tracking-wide">VIAL</h1>
        <p className="text-neutral-400 mt-1">Admin Dashboard</p>
      </div>

      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl flex items-center gap-2 disabled:opacity-50"
          >
            {isRefreshing ? (
              <Unicons.UilSpinnerAlt size="18" className="animate-spin" />
            ) : (
              <Unicons.UilSync size="18" />
            )}
            <span className="text-sm">Refresh</span>
          </button>
        )}

        <button
          onClick={onQuickUpload}
          className="px-4 py-2 bg-lime-400 text-black font-medium rounded-xl hover:bg-lime-300 transition-colors flex items-center gap-2"
        >
          <Unicons.UilUpload size="18" />
          <span className="text-sm">Quick Upload</span>
        </button>

        <button
          onClick={onPrint}
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl flex items-center gap-2"
        >
          <Unicons.UilPrint size="18" />
          <span className="text-sm">Print</span>
        </button>
      </div>
    </header>
  );
}