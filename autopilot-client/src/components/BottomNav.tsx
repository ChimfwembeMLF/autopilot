import { Home, Package, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/shipments", icon: Package, label: "Shipments" },
  { path: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = location.pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors ${
                active
                  ? "text-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[11px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
