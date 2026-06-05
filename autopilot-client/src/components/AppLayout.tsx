import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "./BottomNav";
import { Loader2 } from "lucide-react";
import Topbar from "./Topbar";

export default function AppLayout() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen pb-20">
      <Topbar />

      <div className="safe-top mx-auto w-full max-w-screen-md">
        <Outlet />
      </div>

      <BottomNav />
    </div>
  );
}
