import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  Package,
  MapPin,
  Calendar,
  Shield,
  Info,
  User,
  Mail,
  Phone,
  CreditCard,
  Hash,
  Copy,
  Check,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { getShipment, verifyShipment, getVerificationStatus } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Shipment {
  id: string | number;
  tracking_number?: string;
  order_number?: string;
  origin?: string;
  destination?: string;
  shipping_address?: string;
  status?: string;
  inserted_at?: string;
  date_of_delivery?: string;
  total_amount?: string | number;
  payment_method?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

// ─── Detail Row ─────────────────────────────────────────────────────────────────

function DetailRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
          {label}
        </p>
        <p className={`text-sm font-medium truncate mt-0.5 ${mono ? "font-mono" : ""}`}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

// ─── Copy Button ────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silently fail — clipboard not available
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied!" : "Copy to clipboard"}</TooltipContent>
    </Tooltip>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="px-4 pt-6 safe-top space-y-4 max-w-md mx-auto animate-pulse">
      <div className="h-6 w-24 bg-muted rounded-lg" />
      <div className="bg-card rounded-3xl p-5 shadow-sm border border-muted space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-40 bg-muted rounded-lg" />
          <div className="h-6 w-20 bg-muted rounded-full" />
        </div>
        <div className="h-8 w-full bg-muted rounded-lg" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-9 w-9 bg-muted rounded-xl shrink-0" />
            <div className="space-y-1 flex-1">
              <div className="h-2.5 w-16 bg-muted rounded" />
              <div className="h-4 w-32 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const [adminCode, setAdminCode] = useState<string | null>(null);
  const [loadingAdminCode, setLoadingAdminCode] = useState(false);

  const isAdmin = user?.type === "COURIER_ADMIN";

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchShipment = useCallback(async (shipmentId: string) => {
    try {
      const res = await getShipment(shipmentId);
      const data: Shipment | null = res?.data ?? null;
      setShipment(data);

      if (data && isAdmin) {
        setLoadingAdminCode(true);
        try {
          const vRes = await getVerificationStatus(shipmentId);
          const code =
            vRes?.data?.verification_code ??
            vRes?.data?.code ??
            vRes?.verification_code ??
            vRes?.code ??
            null;
          setAdminCode(code);
        } catch {
          setAdminCode(null);
        } finally {
          setLoadingAdminCode(false);
        }
      }
    } catch {
      setError("Failed to load shipment. Please try again.");
      setShipment(null);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!id) {
      setError("No shipment ID provided.");
      setLoading(false);
      return;
    }
    fetchShipment(id);
  }, [id, fetchShipment]);

  // ── Verify handler ───────────────────────────────────────────────────────────

  const handleVerify = async () => {
    if (!verifyCode.trim()) {
      setVerifyError("Please enter a verification code.");
      return;
    }
    if (!shipment) return;

    setVerifyError(null);
    setVerifying(true);

    try {
      await verifyShipment({
        order_id: shipment.id,
        verification_code: verifyCode.trim(),
        notes: "Verified via app",
      });

      toast({ title: "Shipment Verified", description: "Delivery successfully confirmed." });

      // Re-fetch to get updated status
      const res = await getShipment(id!);
      setShipment(res?.data ?? null);
      setVerifyCode("");
    } catch (err: any) {
      const msg: string = err?.message ?? "Verification failed. Please check the code and try again.";
      // Surface as inline error, not just a toast
      setVerifyError(msg);
      toast({ title: "Verification Failed", description: msg, variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  // ── States ───────────────────────────────────────────────────────────────────

  if (loading) return <LoadingSkeleton />;

  if (error || !shipment) {
    return (
      <div className="px-4 pt-6 safe-top max-w-md mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground mb-6 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
          <Package className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-base font-semibold">{error ?? "Shipment not found"}</p>
          <p className="text-sm text-muted-foreground">
            This shipment may have been removed or the ID is incorrect.
          </p>
          <Button variant="outline" className="mt-2 rounded-xl" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // ── Data ─────────────────────────────────────────────────────────────────────

  const isVerified =
    shipment.status === "DELIVERED" || shipment.status === "VERIFIED";

  const details: { icon: React.ElementType; label: string; value: string; mono?: boolean }[] = [
    { icon: Hash, label: "Tracking Number", value: shipment.tracking_number || `#${shipment.id}`, mono: true },
    { icon: Package, label: "Order Number", value: shipment.order_number ?? "" },
    { icon: MapPin, label: "Origin", value: shipment.origin ?? "" },
    { icon: MapPin, label: "Destination", value: shipment.destination ?? "" },
    { icon: MapPin, label: "Shipping Address", value: shipment.shipping_address ?? "" },
    {
      icon: Calendar,
      label: "Created",
      value: shipment.inserted_at
        ? new Date(shipment.inserted_at).toLocaleDateString(undefined, { dateStyle: "medium" })
        : "",
    },
    {
      icon: Calendar,
      label: "Delivery Date",
      value: shipment.date_of_delivery
        ? new Date(shipment.date_of_delivery).toLocaleDateString(undefined, { dateStyle: "medium" })
        : "",
    },
    {
      icon: CreditCard,
      label: "Amount",
      value: shipment.total_amount != null ? `$${shipment.total_amount}` : "",
    },
    { icon: CreditCard, label: "Payment Method", value: shipment.payment_method ?? "" },
  ];

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className="px-4 pt-6 pb-24 safe-top animate-fade-in space-y-4 max-w-md mx-auto">

        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        {/* Main card */}
        <Card className="rounded-3xl border-muted shadow-sm">
          <CardHeader className="px-5 pt-5 pb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-xl font-bold truncate">Shipment Details</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                  {shipment.tracking_number || `#${shipment.id}`}
                </p>
              </div>
              <StatusBadge status={shipment.status ?? "PENDING"} />
            </div>
          </CardHeader>

          <CardContent className="px-5 pt-4 pb-5">
            <Tabs defaultValue="details" className="w-full">

              {/* Tab bar */}
              <TabsList className="flex border-b border-border mb-5 bg-transparent p-0 h-auto justify-start rounded-none w-full">
                {(["details", "customer", "verify"] as const).map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="
                      w-full
                      rounded-none shadow-none
                      pb-2.5 text-sm capitalize
                      text-muted-foreground
                      data-[state=active]:text-foreground
                      data-[state=active]:font-semibold
                      data-[state=active]:border-b-2
                      data-[state=active]:border-accent
                      data-[state=active]:mb-[-1px]
                      transition-colors
                      bg-none
                    "
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* ── Details tab ── */}
              <TabsContent value="details" className="mt-0 space-y-3.5">
                {details.map((d) => (
                  <DetailRow key={d.label} {...d} />
                ))}
              </TabsContent>

              {/* ── Customer tab ── */}
              <TabsContent value="customer" className="mt-0">
                {shipment.customer ? (
                  <div className="space-y-3.5">
                    <DetailRow
                      icon={User}
                      label="Name"
                      value={shipment.customer.name ?? ""}
                    />
                    <Separator />
                    <DetailRow
                      icon={Mail}
                      label="Email"
                      value={shipment.customer.email ?? ""}
                    />
                    <Separator />
                    <DetailRow
                      icon={Phone}
                      label="Phone"
                      value={shipment.customer.phone ?? ""}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                    <User className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm font-medium">No customer information</p>
                    <p className="text-xs text-muted-foreground">
                      Customer details were not attached to this shipment.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* ── Verify tab ── */}
              <TabsContent value="verify" className="mt-0">
                {isVerified ? (
                  <div className="flex flex-col items-center justify-center p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center space-y-2">
                    <CheckCircle className="h-10 w-10 text-emerald-500" />
                    <p className="text-sm font-semibold text-emerald-800">
                      Shipment already verified
                    </p>
                    <p className="text-xs text-emerald-600">
                      This shipment was successfully delivered and verified.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">

                    {/* Admin code panel */}
                    {isAdmin && (
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                          <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
                          Admin Access Panel
                        </div>
                        <p className="text-xs text-emerald-700 leading-relaxed">
                          As a Courier Administrator, you have full visibility of the verification credentials for override purposes.
                        </p>

                        {loadingAdminCode ? (
                          <div className="flex items-center gap-2 text-xs text-emerald-600 py-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Retrieving customer verification code…
                          </div>
                        ) : adminCode ? (
                          <div className="flex items-center justify-between bg-white/80 p-3 rounded-xl border border-emerald-200 mt-1">
                            <div className="min-w-0">
                              <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">
                                Customer Delivery Code
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <p className="text-lg font-mono font-bold text-emerald-800 tracking-wider">
                                  {adminCode}
                                </p>
                                <CopyButton text={adminCode} />
                              </div>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-emerald-300 text-emerald-700 hover:bg-emerald-100/50 rounded-lg text-xs shrink-0"
                                  onClick={() => {
                                    setVerifyCode(adminCode);
                                    setVerifyError(null);
                                  }}
                                >
                                  Auto-fill
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Fill the code into the input below</TooltipContent>
                            </Tooltip>
                          </div>
                        ) : (
                          <p className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-100 mt-1">
                            <Info className="h-3.5 w-3.5 shrink-0" />
                            No delivery verification code found for this order.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Verify form */}
                    <div className="space-y-3">
                      <h2 className="text-sm font-semibold flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-accent" />
                        Verify Delivery
                      </h2>

                      <div className="flex gap-2">
                        <div className="flex-1 space-y-1">
                          <Input
                            value={verifyCode}
                            onChange={(e) => {
                              setVerifyCode(e.target.value);
                              if (verifyError) setVerifyError(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !verifying) handleVerify();
                            }}
                            placeholder="Enter verification code"
                            className={`h-11 rounded-xl ${verifyError ? "border-destructive focus:border-destructive" : ""}`}
                            aria-invalid={!!verifyError}
                            disabled={verifying}
                          />
                          {verifyError && (
                            <p className="text-xs text-destructive">{verifyError}</p>
                          )}
                        </div>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              disabled={verifying || !verifyCode.trim()}
                              className="h-11 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 px-5 shrink-0"
                            >
                              {verifying ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Verify"
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Verification</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will mark the shipment as delivered and verified. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleVerify}
                                className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
                              >
                                Confirm
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

            </Tabs>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}