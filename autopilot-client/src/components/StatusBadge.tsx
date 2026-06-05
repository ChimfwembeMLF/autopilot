import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  DELIVERED: "bg-success/15 text-success",
  IN_TRANSIT: "bg-info/15 text-info",
  PENDING: "bg-warning/15 text-warning",
  CANCELLED: "bg-destructive/15 text-destructive",
  ASSIGNED: "bg-accent/15 text-accent",
  VERIFIED: "bg-success/15 text-success",
};

export default function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] || "bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", style)}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
