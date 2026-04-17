import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Building2, LogIn } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { extractApiError } from "../../lib/api";
import { Button } from "../../components/uid/Button";
import { Input } from "../../components/uid/Input";
import { Alert } from "../../components/uid/Alert";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ??
    "/dashboard";

  const [form, setForm] = useState({ slug: "", email: "", password: "" });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const newErrors: Partial<typeof form> = {};
    if (!form.slug.trim()) newErrors.slug = "Company slug is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "Invalid email format";
    if (!form.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setApiError("");
    setLoading(true);

    try {
      await login({
        slug: form.slug.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      navigate(from, { replace: true });
    } catch (err) {
      const { message } = extractApiError(err);
      setApiError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-sidebar p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sidebar-accent rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-sidebar-foreground tracking-wide">
            WAPE
          </span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-sidebar-foreground leading-tight">
            Manage your construction projects with confidence
          </h1>
          <p className="text-sidebar-foreground/70 text-lg leading-relaxed">
            ERP platform for construction & engineering companies. Projects,
            procurement, billing and finance — all in one place.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Projects", value: "500+" },
              { label: "Tenants", value: "120+" },
              { label: "Invoices", value: "10K+" },
              { label: "Uptime", value: "99.9%" },
            ].map((stat) => (
              <div key={stat.label} className="bg-sidebar-muted rounded-xl p-4">
                <p className="text-2xl font-bold text-sidebar-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-sidebar-foreground/60 mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sidebar-foreground/40 text-sm">
          © {new Date().getFullYear()} WAPE Platform. All rights reserved.
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">WAPE</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground">
              Sign in to your company account
            </p>
          </div>

          {apiError && (
            <Alert
              variant="error"
              message={apiError}
              onClose={() => setApiError("")}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              id="slug"
              type="text"
              label="Company slug"
              placeholder="e.g. acme-construction"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              error={errors.slug}
              autoComplete="organization"
              autoFocus
            />

            <Input
              id="email"
              type="email"
              label="Email address"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              error={errors.email}
              autoComplete="email"
            />

            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              error={errors.password}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              className="mt-2"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-primary hover:underline transition-all"
              >
                Create your company
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
