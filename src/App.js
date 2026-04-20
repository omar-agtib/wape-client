import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/auth/AuthProvider";
import { CurrencyProvider } from "./contexts/currency/CurrencyProvider";
import { Toaster } from "@/components/ui/sonner";
import { AppRouter } from "./router";
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 30,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});
export default function App() {
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsx(AuthProvider, { children: _jsxs(CurrencyProvider, { children: [_jsx(AppRouter, {}), _jsx(Toaster, {})] }) }) }));
}
