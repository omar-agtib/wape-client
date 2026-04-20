import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { onNotification } from "@/lib/socket";
import { getInitials } from "@/lib/utils";
import type { RealtimeNotification } from "@/types/api";
import { useCurrency } from "@/hooks/useCurrency";
import { CURRENCIES } from "@/constants/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TopBarProps {
  onToggleSidebar: () => void;
  pageTitle: string;
}

export default function TopBar({ onToggleSidebar, pageTitle }: TopBarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>(
    [],
  );
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Listen to real-time notifications
  useEffect(() => {
    const unsubscribe = onNotification((notif) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 10));
      setUnreadCount((n) => n + 1);
    });
    return unsubscribe;
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const notifIconColors: Record<string, string> = {
    success: "text-success",
    warning: "text-warning",
    error: "text-destructive",
    info: "text-info",
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0 z-30 relative">
      {/* ── Left ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground hidden sm:block">
          {pageTitle}
        </h1>
      </div>

      {/* ── Right ── */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="
              pl-9 pr-4 h-9 w-56 rounded-lg bg-muted/50 border border-border
              text-sm text-foreground placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
              transition-all
            "
          />
        </div>

        {/* Currency selector */}
        <Select
          onValueChange={(value) => setCurrency(value)}
          defaultValue={currency}
        >
          <SelectTrigger className="h-9 w-40 border border-border bg-muted/50 rounded-lg">
            <SelectValue
              placeholder={
                CURRENCIES.find((c) => c.code === currency)?.symbol ??
                "Currency"
              }
            />
          </SelectTrigger>
          <SelectContent className="bg-card border border-border rounded-lg">
            {CURRENCIES.map((curr) => (
              <SelectItem key={curr.code} value={curr.code}>
                {curr.symbol} - {curr.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              setUnreadCount(0);
            }}
            className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            )}
          </button>

          {notifOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setNotifOpen(false)}
              />
              <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground">
                    Notifications
                  </p>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No notifications yet
                    </p>
                  ) : (
                    notifications.map((notif, i) => (
                      <div
                        key={i}
                        className="px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => {
                          if (notif.link) navigate(notif.link);
                          setNotifOpen(false);
                        }}
                      >
                        <p
                          className={`text-xs font-semibold ${notifIconColors[notif.type] ?? "text-foreground"}`}
                        >
                          {notif.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {notif.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {user ? (
                <span className="text-xs font-bold text-primary">
                  {getInitials(user.fullName)}
                </span>
              ) : (
                <User className="w-4 h-4 text-primary" />
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-foreground leading-none">
                {user?.fullName ?? "User"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                {user?.role?.replace("_", " ") ?? ""}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-12 w-52 bg-card border border-border rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigate("/settings");
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  Settings
                </button>
                <div className="border-t border-border my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
