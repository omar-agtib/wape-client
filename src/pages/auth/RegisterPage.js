import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, UserPlus, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { extractApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
const STEPS = ["Company", "Account", "Security"];
export function RegisterPage() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState({
        companyName: "",
        slug: "",
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [loading, setLoading] = useState(false);
    // Auto-generate slug from company name
    function handleCompanyNameChange(value) {
        const slug = value
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .slice(0, 50);
        setForm((f) => ({ ...f, companyName: value, slug }));
    }
    function validateStep(s) {
        const newErrors = {};
        if (s === 0) {
            if (!form.companyName.trim())
                newErrors.companyName = "Company name is required";
            if (!form.slug.trim())
                newErrors.slug = "Slug is required";
            else if (!/^[a-z0-9-]+$/.test(form.slug))
                newErrors.slug =
                    "Slug must be lowercase, letters, numbers, hyphens only";
        }
        if (s === 1) {
            if (!form.fullName.trim())
                newErrors.fullName = "Full name is required";
            if (!form.email.trim())
                newErrors.email = "Email is required";
            else if (!/\S+@\S+\.\S+/.test(form.email))
                newErrors.email = "Invalid email";
        }
        if (s === 2) {
            if (!form.password)
                newErrors.password = "Password is required";
            else if (form.password.length < 8)
                newErrors.password = "At least 8 characters";
            else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#])/.test(form.password)) {
                newErrors.password =
                    "Needs uppercase, lowercase, number and special character";
            }
            if (form.password !== form.confirmPassword)
                newErrors.confirmPassword = "Passwords do not match";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }
    function handleNext() {
        if (validateStep(step))
            setStep((s) => s + 1);
    }
    async function handleSubmit(e) {
        e.preventDefault();
        if (!validateStep(2))
            return;
        setApiError("");
        setLoading(true);
        try {
            await register({
                companyName: form.companyName.trim(),
                slug: form.slug.trim(),
                fullName: form.fullName.trim(),
                email: form.email.trim().toLowerCase(),
                password: form.password,
            });
            navigate("/dashboard", { replace: true });
        }
        catch (err) {
            const { message, field } = extractApiError(err);
            setApiError(message);
            // Go back to the step with the error
            if (field === "slug")
                setStep(0);
            if (field === "email")
                setStep(1);
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("div", { className: "min-h-screen flex", children: [_jsxs("div", { className: "hidden lg:flex lg:w-2/5 flex-col justify-between bg-sidebar p-12", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-sidebar-accent rounded-xl flex items-center justify-center", children: _jsx(Building2, { className: "w-6 h-6 text-white" }) }), _jsx("span", { className: "text-2xl font-bold text-sidebar-foreground tracking-wide", children: "WAPE" })] }), _jsxs("div", { className: "space-y-8", children: [_jsxs("div", { className: "space-y-3", children: [_jsx("h1", { className: "text-3xl font-bold text-sidebar-foreground", children: "Start managing your projects today" }), _jsx("p", { className: "text-sidebar-foreground/70 leading-relaxed", children: "Join construction companies who trust WAPE to manage their projects, procurement, and finances." })] }), _jsx("div", { className: "space-y-3", children: [
                                    "Full project lifecycle management",
                                    "Automated subcontractor billing",
                                    "Real-time financial dashboard",
                                    "Stock & procurement tracking",
                                    "Non-conformity management",
                                ].map((feature) => (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-success shrink-0" }), _jsx("span", { className: "text-sm text-sidebar-foreground/80", children: feature })] }, feature))) })] }), _jsxs("p", { className: "text-sidebar-foreground/40 text-sm", children: ["\u00A9 ", new Date().getFullYear(), " WAPE Platform"] })] }), _jsx("div", { className: "flex-1 flex items-center justify-center p-6 sm:p-12 bg-background", children: _jsxs("div", { className: "w-full max-w-md space-y-8", children: [_jsxs("div", { className: "lg:hidden flex items-center gap-3 mb-6", children: [_jsx("div", { className: "w-9 h-9 bg-primary rounded-xl flex items-center justify-center", children: _jsx(Building2, { className: "w-5 h-5 text-white" }) }), _jsx("span", { className: "text-xl font-bold text-foreground", children: "WAPE" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h2", { className: "text-3xl font-bold text-foreground", children: "Create account" }), _jsx("p", { className: "text-muted-foreground", children: "Set up your company on WAPE in 3 steps" })] }), _jsx("div", { className: "flex items-center gap-2", children: STEPS.map((label, i) => (_jsxs(React.Fragment, { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `
                      w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                      transition-all duration-300
                      ${i < step ? "bg-success text-success-foreground" : ""}
                      ${i === step ? "bg-primary text-primary-foreground" : ""}
                      ${i > step ? "bg-muted text-muted-foreground" : ""}
                    `, children: i < step ? _jsx(CheckCircle, { className: "w-4 h-4" }) : i + 1 }), _jsx("span", { className: `text-xs font-medium hidden sm:block ${i === step ? "text-foreground" : "text-muted-foreground"}`, children: label })] }), i < STEPS.length - 1 && (_jsx("div", { className: `flex-1 h-0.5 rounded-full transition-all duration-300 ${i < step ? "bg-success" : "bg-border"}` }))] }, label))) }), apiError && (_jsx(Alert, { variant: "error", message: apiError, onClose: () => setApiError("") })), _jsxs("form", { onSubmit: step === 2
                                ? handleSubmit
                                : (e) => {
                                    e.preventDefault();
                                    handleNext();
                                }, noValidate: true, children: [step === 0 && (_jsxs("div", { className: "space-y-5", children: [_jsx(Input, { id: "companyName", label: "Company name", placeholder: "ACME Construction Maroc", value: form.companyName, onChange: (e) => handleCompanyNameChange(e.target.value), error: errors.companyName, autoFocus: true }), _jsx(Input, { id: "slug", label: "Company slug", placeholder: "acme-construction-maroc", value: form.slug, onChange: (e) => setForm((f) => ({
                                                ...f,
                                                slug: e.target.value
                                                    .toLowerCase()
                                                    .replace(/[^a-z0-9-]/g, ""),
                                            })), error: errors.slug, hint: "Used to identify your company when logging in. Cannot be changed later." })] })), step === 1 && (_jsxs("div", { className: "space-y-5", children: [_jsx(Input, { id: "fullName", label: "Your full name", placeholder: "Ahmed Alami", value: form.fullName, onChange: (e) => setForm((f) => ({ ...f, fullName: e.target.value })), error: errors.fullName, autoFocus: true }), _jsx(Input, { id: "email", type: "email", label: "Email address", placeholder: "ahmed@acme.ma", value: form.email, onChange: (e) => setForm((f) => ({ ...f, email: e.target.value })), error: errors.email })] })), step === 2 && (_jsxs("div", { className: "space-y-5", children: [_jsx(Input, { id: "password", type: "password", label: "Password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: form.password, onChange: (e) => setForm((f) => ({ ...f, password: e.target.value })), error: errors.password, hint: "Minimum 8 characters with uppercase, lowercase, number and special character", autoFocus: true }), _jsx(Input, { id: "confirmPassword", type: "password", label: "Confirm password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: form.confirmPassword, onChange: (e) => setForm((f) => ({ ...f, confirmPassword: e.target.value })), error: errors.confirmPassword })] })), _jsxs("div", { className: "flex gap-3 mt-8", children: [step > 0 && (_jsx(Button, { type: "button", variant: "outline", size: "lg", className: "flex-1", onClick: () => setStep((s) => s - 1), disabled: loading, children: "Back" })), _jsx(Button, { type: "submit", size: "lg", className: "flex-1", loading: loading, children: step < 2 ? ("Continue") : (_jsxs(_Fragment, { children: [_jsx(UserPlus, { className: "w-4 h-4" }), loading ? "Creating account..." : "Create account"] })) })] })] }), _jsx("div", { className: "text-center", children: _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Already have an account?", " ", _jsx(Link, { to: "/login", className: "font-medium text-primary hover:underline", children: "Sign in" })] }) })] }) })] }));
}
