import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ComingSoon({ title }) {
    return (_jsxs("div", { className: "flex flex-col items-center justify-center h-full min-h-[60vh] gap-4", children: [_jsx("div", { className: "w-14 h-14 bg-muted rounded-2xl flex items-center justify-center", children: _jsx("span", { className: "text-2xl", children: "\uD83D\uDEA7" }) }), _jsx("h2", { className: "text-lg font-semibold text-foreground", children: title }), _jsx("p", { className: "text-sm text-muted-foreground", children: "This page is being integrated with the WAPE backend." })] }));
}
