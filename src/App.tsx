import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/auth/AuthProvider";
import { AppRouter } from "./router";
import { CurrencyProvider } from "./contexts/currency/CurrencyProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
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
          <AppRouter />
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
