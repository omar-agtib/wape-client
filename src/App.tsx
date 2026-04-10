import { AuthProvider } from "./contexts/AuthProvider";
import { AppRouter } from "./router";

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
