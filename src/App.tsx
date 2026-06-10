import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
} from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { AuthProvider } from "./contexts/auth/AuthProvider";
import { CurrencyProvider } from "./contexts/currency/CurrencyProvider";
import { Toaster } from "@/components/ui/sonner";
import { AppRouter } from "./router";
import { extractError } from "@/lib/api";

// Global handler: every mutation (create/update/delete/etc.) that throws
// shows a clean toast with the backend's message — unless the mutation opts
// out via meta.skipGlobalError (used by forms that show inline field errors).
const mutationCache = new MutationCache({
  onError: (error, _vars, _ctx, mutation) => {
    // 401/403 are handled by the axios interceptor — don't double-toast.
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 401 || status === 403) return;
    }
    // Let a mutation suppress the global toast (e.g. it shows inline errors).
    if (mutation.options.meta?.skipGlobalError) return;

    toast.error(extractError(error));
  },
});

const queryClient = new QueryClient({
  mutationCache,
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
          <AppRouter />
          <Toaster />
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
