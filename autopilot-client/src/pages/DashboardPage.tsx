import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardStats, getRecentShipments } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import { 
  Package, 
  TrendingUp, 
  Truck, 
  CheckCircle, 
  Loader2, 
  ChevronRight, 
  Shield, 
  Users, 
  Clock, 
  Calendar, 
  ClipboardList 
} from "lucide-react";

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.type === "COURIER_ADMIN";

  useEffect(() => {
    Promise.all([
      getDashboardStats().catch(() => null),
      getRecentShipments(5).catch(() => ({ data: [] })),
    ]).then(([s, r]) => {
      setStats(s?.data || null);
      setRecent(r?.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // Grouped Admin Stats
  const adminGroups = stats && isAdmin ? [
    {
      title: "Logistics Overview",
      subtitle: "System scale and workforce",
      colorClass: "border-indigo-100 bg-indigo-50/20 text-indigo-700",
      cards: [
        { label: "Total Shipments", value: stats.total_shipments ?? 0, icon: Package, color: "bg-indigo-100 text-indigo-700" },
        { label: "Active Agents", value: stats.total_agents ?? 0, icon: Users, color: "bg-indigo-100 text-indigo-700" },
      ]
    },
    {
      title: "Active Pipeline",
      subtitle: "Current delivery lifecycle status",
      colorClass: "border-amber-100 bg-amber-50/20 text-amber-700",
      cards: [
        { label: "Pending Pickup", value: stats.pending_pickup ?? 0, icon: Clock, color: "bg-amber-100 text-amber-700" },
        { label: "Pending Shipments", value: stats.pending_shipments ?? 0, icon: ClipboardList, color: "bg-amber-100 text-amber-700" },
        { label: "In Transit", value: stats.in_transit ?? 0, icon: Truck, color: "bg-amber-100 text-amber-700" },
      ]
    },
    {
      title: "Performance & Success",
      subtitle: "Completed and today's deliveries",
      colorClass: "border-emerald-100 bg-emerald-50/20 text-emerald-700",
      cards: [
        { label: "Today's Deliveries", value: stats.today_deliveries ?? 0, icon: Calendar, color: "bg-emerald-100 text-emerald-700" },
        { label: "Total Delivered", value: stats.delivered ?? 0, icon: CheckCircle, color: "bg-emerald-100 text-emerald-700" },
      ]
    }
  ] : [];

  // Fallback / Agent Stats
  const agentCards = stats && !isAdmin ? [
    { label: "Total Shipments", value: stats.total_shipments ?? 0, icon: Package, color: "bg-primary/10 text-primary" },
    { label: "In Transit", value: stats.in_transit ?? 0, icon: Truck, color: "bg-info/15 text-info" },
    { label: "Delivered", value: stats.delivered ?? 0, icon: CheckCircle, color: "bg-success/15 text-success" },
    { label: "Pending Pickups", value: stats.pending_pickup ?? stats.pending ?? 0, icon: Clock, color: "bg-warning/15 text-warning" },
  ] : [];

  return (
    <div className="px-4 pt-6 safe-top animate-fade-in">
      <div className="mb-6 bg-card rounded-2xl p-5 shadow-sm border border-muted flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            {isAdmin ? "Admin Control Room" : "Delivery Field Agent"}
          </p>
          <h1 className="text-2xl font-bold flex items-center gap-2 mt-1">
            {user?.first_name || "User"} 👋
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {isAdmin ? "Managing system-wide logistics & dispatches" : "Assigned delivery routes and order verification"}
          </p>
        </div>
        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
          isAdmin ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
        }`}>
          {isAdmin ? <Shield className="h-6 w-6" /> : <Truck className="h-6 w-6" />}
        </div>
      </div>

      {/* RENDER STATS */}
      {stats && (
        <div className="mb-6 space-y-6">
          {isAdmin ? (
            // Admin Grouped View
            adminGroups.map((group) => (
              <div key={group.title} className="space-y-2.5 animate-slide-up">
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-foreground tracking-wide flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    {group.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground ml-3">{group.subtitle}</p>
                </div>
                <div className={`grid ${group.cards.length === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                  {group.cards.map((card) => (
                    <div 
                      key={card.label} 
                      className="bg-card rounded-2xl p-4 shadow-sm border border-muted hover:border-accent/10 transition-all flex flex-col justify-between min-h-[110px]"
                    >
                      <div className={`h-8 w-8 rounded-xl ${card.color} flex items-center justify-center shrink-0`}>
                        <card.icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="mt-3">
                        <p className="text-2xl font-extrabold tracking-tight">{card.value}</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5 truncate">{card.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Agent Grid View
            <div className="grid grid-cols-2 gap-3 animate-slide-up">
              {agentCards.map((card) => (
                <div key={card.label} className="bg-card rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[115px]">
                  <div className={`h-9 w-9 rounded-xl ${card.color} flex items-center justify-center`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Shipments</h2>
        <button onClick={() => navigate("/shipments")} className="text-sm text-accent font-medium">
          View All
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">No recent shipments</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recent.map((shipment: any) => (
            <button
              key={shipment.id}
              onClick={() => navigate(`/shipments/${shipment.id}`)}
              className="w-full bg-card rounded-2xl p-4 flex items-center gap-3 shadow-sm text-left hover:shadow-md transition-shadow"
            >
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Package className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{shipment.tracking_number || `#${shipment.id}`}</p>
                <p className="text-xs text-muted-foreground truncate">{shipment.destination || "—"}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={shipment.status || "PENDING"} />
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
