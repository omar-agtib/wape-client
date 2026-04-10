import React, { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, UserPlus, CheckCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { extractApiError } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Alert } from "../../components/ui/Alert";

interface FormState {
  companyName: string;
  slug: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const STEPS = ["Company", "Account", "Security"] as const;

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    companyName: "",
    slug: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-generate slug from company name
  function handleCompanyNameChange(value: string) {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 50);
    setForm((f) => ({ ...f, companyName: value, slug }));
  }

  function validateStep(s: number): boolean {
    const newErrors: Partial<FormState> = {};

    if (s === 0) {
      if (!form.companyName.trim())
        newErrors.companyName = "Company name is required";
      if (!form.slug.trim()) newErrors.slug = "Slug is required";
      else if (!/^[a-z0-9-]+$/.test(form.slug))
        newErrors.slug =
          "Slug must be lowercase, letters, numbers, hyphens only";
    }

    if (s === 1) {
      if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
      if (!form.email.trim()) newErrors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.email))
        newErrors.email = "Invalid email";
    }

    if (s === 2) {
      if (!form.password) newErrors.password = "Password is required";
      else if (form.password.length < 8)
        newErrors.password = "At least 8 characters";
      else if (
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#])/.test(form.password)
      ) {
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
    if (validateStep(step)) setStep((s) => s + 1);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateStep(2)) return;

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
    } catch (err) {
      const { message, field } = extractApiError(err);
      setApiError(message);
      // Go back to the step with the error
      if (field === "slug") setStep(0);
      if (field === "email") setStep(1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between bg-sidebar p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sidebar-accent rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-sidebar-foreground tracking-wide">
            WAPE
          </span>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-sidebar-foreground">
              Start managing your projects today
            </h1>
            <p className="text-sidebar-foreground/70 leading-relaxed">
              Join construction companies who trust WAPE to manage their
              projects, procurement, and finances.
            </p>
          </div>

          <div className="space-y-3">
            {[
              "Full project lifecycle management",
              "Automated subcontractor billing",
              "Real-time financial dashboard",
              "Stock & procurement tracking",
              "Non-conformity management",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-success shrink-0" />
                <span className="text-sm text-sidebar-foreground/80">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sidebar-foreground/40 text-sm">
          © {new Date().getFullYear()} WAPE Platform
        </p>
      </div>

      {/* ── Right panel — multi-step form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">WAPE</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              Create account
            </h2>
            <p className="text-muted-foreground">
              Set up your company on WAPE in 3 steps
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                <div className="flex items-center gap-2">
                  <div
                    className={`
                      w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                      transition-all duration-300
                      ${i < step ? "bg-success text-success-foreground" : ""}
                      ${i === step ? "bg-primary text-primary-foreground" : ""}
                      ${i > step ? "bg-muted text-muted-foreground" : ""}
                    `}
                  >
                    {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:block ${
                      i === step ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 rounded-full transition-all duration-300 ${
                      i < step ? "bg-success" : "bg-border"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {apiError && (
            <Alert
              variant="error"
              message={apiError}
              onClose={() => setApiError("")}
            />
          )}

          <form
            onSubmit={
              step === 2
                ? handleSubmit
                : (e) => {
                    e.preventDefault();
                    handleNext();
                  }
            }
            noValidate
          >
            {/* ── Step 0: Company ── */}
            {step === 0 && (
              <div className="space-y-5">
                <Input
                  id="companyName"
                  label="Company name"
                  placeholder="ACME Construction Maroc"
                  value={form.companyName}
                  onChange={(e) => handleCompanyNameChange(e.target.value)}
                  error={errors.companyName}
                  autoFocus
                />
                <Input
                  id="slug"
                  label="Company slug"
                  placeholder="acme-construction-maroc"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, ""),
                    }))
                  }
                  error={errors.slug}
                  hint="Used to identify your company when logging in. Cannot be changed later."
                />
              </div>
            )}

            {/* ── Step 1: Account ── */}
            {step === 1 && (
              <div className="space-y-5">
                <Input
                  id="fullName"
                  label="Your full name"
                  placeholder="Ahmed Alami"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fullName: e.target.value }))
                  }
                  error={errors.fullName}
                  autoFocus
                />
                <Input
                  id="email"
                  type="email"
                  label="Email address"
                  placeholder="ahmed@acme.ma"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  error={errors.email}
                />
              </div>
            )}

            {/* ── Step 2: Security ── */}
            {step === 2 && (
              <div className="space-y-5">
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
                  hint="Minimum 8 characters with uppercase, lowercase, number and special character"
                  autoFocus
                />
                <Input
                  id="confirmPassword"
                  type="password"
                  label="Confirm password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, confirmPassword: e.target.value }))
                  }
                  error={errors.confirmPassword}
                />
              </div>
            )}

            {/* ── Navigation buttons ── */}
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => setStep((s) => s - 1)}
                  disabled={loading}
                >
                  Back
                </Button>
              )}
              <Button
                type="submit"
                size="lg"
                className="flex-1"
                loading={loading}
              >
                {step < 2 ? (
                  "Continue"
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    {loading ? "Creating account..." : "Create account"}
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
