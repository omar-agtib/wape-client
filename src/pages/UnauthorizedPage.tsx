import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldX } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";

export function UnauthorizedPage() {
  const navigate = useNavigate();
  const { role } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldX className="w-8 h-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Access denied</h1>
          <p className="text-muted-foreground text-sm">
            Your role{" "}
            <span className="font-medium text-foreground">({role})</span> does
            not have permission to access this page.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate(-1)} variant="outline">
            Go back
          </Button>
          <Button onClick={() => navigate("/dashboard")}>
            Go to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
