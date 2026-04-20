import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
export function UnauthorizedPage() {
    const navigate = useNavigate();
    const { role } = useAuth();
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-background p-6", children: _jsxs("div", { className: "text-center space-y-6 max-w-sm", children: [_jsx("div", { className: "w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto", children: _jsx(ShieldX, { className: "w-8 h-8 text-destructive" }) }), _jsxs("div", { className: "space-y-2", children: [_jsx("h1", { className: "text-2xl font-bold text-foreground", children: "Access denied" }), _jsxs("p", { className: "text-muted-foreground text-sm", children: ["Your role", " ", _jsxs("span", { className: "font-medium text-foreground", children: ["(", role, ")"] }), " does not have permission to access this page."] })] }), _jsxs("div", { className: "flex flex-col gap-3", children: [_jsx(Button, { onClick: () => navigate(-1), variant: "outline", children: "Go back" }), _jsx(Button, { onClick: () => navigate("/dashboard"), children: "Go to dashboard" })] })] }) }));
}
