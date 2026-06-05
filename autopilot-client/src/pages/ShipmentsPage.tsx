import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAssignedShipments } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import { Package, Loader2, ChevronRight, Filter, Shield, Truck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const STATUSES = ["ALL", "IN_TRANSIT", "PENDING", "DELIVERED", "ASSIGNED", "CANCELLED"];

export default function ShipmentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");

  const isAdmin = user?.type === "COURIER_ADMIN";

  useEffect(() => {
    setLoading(true);
    getAssignedShipments(1, 50, activeFilter === "ALL" ? undefined : activeFilter)
      .then((res) => setShipments(res?.data || []))
      .catch(() => setShipments([]))
      .finally(() => setLoading(false));
  }, [activeFilter]);

  return (
    <div className="px-4 pt-6 safe-top animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          {isAdmin ? "All Shipments" : "My Shipments"}
        </h1>
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          isAdmin ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-50 text-blue-700 border border-blue-200"
        }`}>
          {isAdmin ? <Shield className="h-3 w-3" /> : <Truck className="h-3 w-3" />}
          {isAdmin ? "Admin view" : "Agent view"}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setActiveFilter(s)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeFilter === s
                ? "bg-accent text-accent-foreground"
                : "bg-card text-muted-foreground"
            }`}
          >
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : shipments.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">No shipments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shipments.map((shipment: any) => (
            <button
              key={shipment.id}
              onClick={() => navigate(`/shipments/${shipment.id}`)}
              className="w-full bg-card rounded-2xl p-4 flex items-center gap-3 shadow-sm text-left hover:shadow-md transition-shadow"
            >
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Package className="h-5 w-5 text-accent" />
              </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{shipment.tracking_number || `Shipment #${shipment.id}`}</p>
                  <p className="text-xs text-muted-foreground truncate">{shipment.origin || "—"} → {shipment.destination || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">Order: {shipment.order_number || "—"} • Amount: ${shipment.total_amount || "0.00"}</p>
                  <p className="text-xs text-muted-foreground truncate">Delivery: {shipment.date_of_delivery || "—"} • Address: {shipment.shipping_address || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">Customer: {shipment.customer?.name || "—"} ({shipment.customer?.email || "—"})</p>
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
