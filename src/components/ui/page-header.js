import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function PageHeader({ title, description, icon, action }) {
    return (_jsxs("div", { className: "flex items-start justify-between mb-8", children: [_jsxs("div", { className: "flex items-center gap-4", children: [icon && (_jsx("div", { className: "w-12 h-12 rounded-xl gradient-primary flex items-center justify-center bg-primary text-white", children: icon })), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-semibold text-foreground", children: title }), description && _jsx("p", { className: "text-muted-foreground mt-1", children: description })] })] }), action && _jsx("div", { children: action })] }));
}
