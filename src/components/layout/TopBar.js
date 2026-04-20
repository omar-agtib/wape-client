import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search, Bell, User, LogOut, Settings, ChevronDown, } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { onNotification } from "@/lib/socket";
import { getInitials } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import { CURRENCIES } from "@/constants/currency";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
export default function TopBar({ onToggleSidebar, pageTitle }) {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { currency, setCurrency } = useCurrency();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
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
    const notifIconColors = {
        success: "text-success",
        warning: "text-warning",
        error: "text-destructive",
        info: "text-info",
    };
    return (_jsxs("header", { className: "h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0 z-30 relative", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: onToggleSidebar, className: "p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors", "aria-label": "Toggle sidebar", children: _jsx(Menu, { className: "w-5 h-5" }) }), _jsx("h1", { className: "text-lg font-semibold text-foreground hidden sm:block", children: pageTitle })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "relative hidden md:block", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }), _jsx("input", { type: "text", placeholder: "Search...", className: "\n              pl-9 pr-4 h-9 w-56 rounded-lg bg-muted/50 border border-border\n              text-sm text-foreground placeholder:text-muted-foreground\n              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent\n              transition-all\n            " })] }), _jsxs(Select, { onValueChange: (value) => setCurrency(value), defaultValue: currency, children: [_jsx(SelectTrigger, { className: "h-9 w-40 border border-border bg-muted/50 rounded-lg", children: _jsx(SelectValue, { placeholder: CURRENCIES.find((c) => c.code === currency)?.symbol ??
                                        "Currency" }) }), _jsx(SelectContent, { className: "bg-card border border-border rounded-lg", children: CURRENCIES.map((curr) => (_jsxs(SelectItem, { value: curr.code, children: [curr.symbol, " - ", curr.code] }, curr.code))) })] }), _jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: () => {
                                    setNotifOpen((v) => !v);
                                    setUnreadCount(0);
                                }, className: "relative p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors", "aria-label": "Notifications", children: [_jsx(Bell, { className: "w-5 h-5" }), unreadCount > 0 && (_jsx("span", { className: "absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" }))] }), notifOpen && (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-10", onClick: () => setNotifOpen(false) }), _jsxs("div", { className: "absolute right-0 top-12 w-80 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden", children: [_jsx("div", { className: "px-4 py-3 border-b border-border", children: _jsx("p", { className: "text-sm font-semibold text-foreground", children: "Notifications" }) }), _jsx("div", { className: "max-h-72 overflow-y-auto", children: notifications.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground text-center py-8", children: "No notifications yet" })) : (notifications.map((notif, i) => (_jsxs("div", { className: "px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer", onClick: () => {
                                                        if (notif.link)
                                                            navigate(notif.link);
                                                        setNotifOpen(false);
                                                    }, children: [_jsx("p", { className: `text-xs font-semibold ${notifIconColors[notif.type] ?? "text-foreground"}`, children: notif.title }), _jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: notif.message })] }, i)))) })] })] }))] }), _jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: () => setUserMenuOpen((v) => !v), className: "flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0", children: user ? (_jsx("span", { className: "text-xs font-bold text-primary", children: getInitials(user.fullName) })) : (_jsx(User, { className: "w-4 h-4 text-primary" })) }), _jsxs("div", { className: "hidden sm:block text-left", children: [_jsx("p", { className: "text-sm font-medium text-foreground leading-none", children: user?.fullName ?? "User" }), _jsx("p", { className: "text-xs text-muted-foreground mt-0.5 capitalize", children: user?.role?.replace("_", " ") ?? "" })] }), _jsx(ChevronDown, { className: "w-4 h-4 text-muted-foreground hidden sm:block" })] }), userMenuOpen && (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-10", onClick: () => setUserMenuOpen(false) }), _jsxs("div", { className: "absolute right-0 top-12 w-52 bg-card border border-border rounded-xl shadow-xl z-20 py-1 overflow-hidden", children: [_jsx("div", { className: "px-4 py-2 border-b border-border", children: _jsx("p", { className: "text-xs text-muted-foreground truncate", children: user?.email }) }), _jsxs("button", { onClick: () => {
                                                    navigate("/settings");
                                                    setUserMenuOpen(false);
                                                }, className: "w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors", children: [_jsx(Settings, { className: "w-4 h-4 text-muted-foreground" }), "Settings"] }), _jsx("div", { className: "border-t border-border my-1" }), _jsxs("button", { onClick: handleLogout, className: "w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors", children: [_jsx(LogOut, { className: "w-4 h-4" }), "Sign out"] })] })] }))] })] })] }));
}
