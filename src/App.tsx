import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/auth/AuthProvider";
import { CurrencyProvider } from "./contexts/currency/CurrencyProvider";
import { ToastProvider } from "./components/ui/Toast";
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
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <ToastProvider>
            <AppRouter />
          </ToastProvider>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
