import { Menu, Bell, Home, Package, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Topbar() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const menuItems = [
        { label: "Dashboard", icon: Home, path: "/dashboard" },
        { label: "Shipments", icon: Package, path: "/shipments" },
        { label: "Profile", icon: User, path: "/profile" },
    ];

    return (
        <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-8 relative">
            {/* Left side: menu button and logo */}
            {/* <div className="flex items-center gap-4">
            <button
          className="p-2 rounded-full hover:bg-black/5"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation menu"
            >
              <Menu size={20} />
            </button>
        <h1
          className="text-xl font-bold text-emerald-500 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          AgShipment
        </h1>
      </div> */}

            {/* Right side: notifications */}
            {/* <button className="p-2 rounded-full hover:bg-black/5" aria-label="Notifications">
        <Bell size={20} />
      </button> */}

            {/* Dropdown navigation */}
            {/* {open && (
        <div className="absolute left-4 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-muted">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className="flex items-center w-full px-4 py-2 hover:bg-muted"
              onClick={() => {
                navigate(item.path);
                setOpen(false);
              }}
            >
              <item.icon className="h-4 w-4 mr-2" />
              {item.label}
      </button>
          ))}
        </div>
      )} */}
        </header>
    );
}