import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Building2, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { extractApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const from = location.state?.from?.pathname ??
        "/dashboard";
    const [form, setForm] = useState({ slug: "", email: "", password: "" });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [loading, setLoading] = useState(false);
    function validate() {
        const newErrors = {};
        if (!form.slug.trim())
            newErrors.slug = "Company slug is required";
        if (!form.email.trim())
            newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(form.email))
            newErrors.email = "Invalid email format";
        if (!form.password)
            newErrors.password = "Password is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }
    async function handleSubmit(e) {
        e.preventDefault();
        if (!validate())
            return;
        setApiError("");
        setLoading(true);
        try {
            await login({
                slug: form.slug.trim().toLowerCase(),
                email: form.email.trim().toLowerCase(),
                password: form.password,
            });
            navigate(from, { replace: true });
        }
        catch (err) {
            const { message } = extractApiError(err);
            setApiError(message);
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("div", { className: "min-h-screen flex", children: [_jsxs("div", { className: "hidden lg:flex lg:w-1/2 flex-col justify-between bg-sidebar p-12", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-sidebar-accent rounded-xl flex items-center justify-center", children: _jsx(Building2, { className: "w-6 h-6 text-white" }) }), _jsx("span", { className: "text-2xl font-bold text-sidebar-foreground tracking-wide", children: "WAPE" })] }), _jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-4xl font-bold text-sidebar-foreground leading-tight", children: "Manage your construction projects with confidence" }), _jsx("p", { className: "text-sidebar-foreground/70 text-lg leading-relaxed", children: "ERP platform for construction & engineering companies. Projects, procurement, billing and finance \u2014 all in one place." }), _jsx("div", { className: "grid grid-cols-2 gap-4", children: [
                                    { label: "Projects", value: "500+" },
                                    { label: "Tenants", value: "120+" },
                                    { label: "Invoices", value: "10K+" },
                                    { label: "Uptime", value: "99.9%" },
                                ].map((stat) => (_jsxs("div", { className: "bg-sidebar-muted rounded-xl p-4", children: [_jsx("p", { className: "text-2xl font-bold text-sidebar-foreground", children: stat.value }), _jsx("p", { className: "text-sm text-sidebar-foreground/60 mt-0.5", children: stat.label })] }, stat.label))) })] }), _jsxs("p", { className: "text-sidebar-foreground/40 text-sm", children: ["\u00A9 ", new Date().getFullYear(), " WAPE Platform. All rights reserved."] })] }), _jsx("div", { className: "flex-1 flex items-center justify-center p-6 sm:p-12 bg-background", children: _jsxs("div", { className: "w-full max-w-md space-y-8", children: [_jsxs("div", { className: "lg:hidden flex items-center gap-3 mb-8", children: [_jsx("div", { className: "w-9 h-9 bg-primary rounded-xl flex items-center justify-center", children: _jsx(Building2, { className: "w-5 h-5 text-white" }) }), _jsx("span", { className: "text-xl font-bold text-foreground", children: "WAPE" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h2", { className: "text-3xl font-bold text-foreground", children: "Welcome back" }), _jsx("p", { className: "text-muted-foreground", children: "Sign in to your company account" })] }), apiError && (_jsx(Alert, { variant: "error", message: apiError, onClose: () => setApiError("") })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", noValidate: true, children: [_jsx(Input, { id: "slug", type: "text", label: "Company slug", placeholder: "e.g. acme-construction", value: form.slug, onChange: (e) => setForm((f) => ({ ...f, slug: e.target.value })), error: errors.slug, autoComplete: "organization", autoFocus: true }), _jsx(Input, { id: "email", type: "email", label: "Email address", placeholder: "your@email.com", value: form.email, onChange: (e) => setForm((f) => ({ ...f, email: e.target.value })), error: errors.email, autoComplete: "email" }), _jsx(Input, { id: "password", type: "password", label: "Password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: form.password, onChange: (e) => setForm((f) => ({ ...f, password: e.target.value })), error: errors.password, autoComplete: "current-password" }), _jsxs(Button, { type: "submit", fullWidth: true, size: "lg", loading: loading, className: "mt-2", children: [_jsx(LogIn, { className: "w-4 h-4" }), loading ? "Signing in..." : "Sign in"] })] }), _jsx("div", { className: "text-center", children: _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Don't have an account?", " ", _jsx(Link, { to: "/register", className: "font-medium text-primary hover:underline transition-all", children: "Create your company" })] }) })] }) })] }));
}
