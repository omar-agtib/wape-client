import { useCallback, useState } from "react";
import { toast } from "sonner";
import axios from "axios";

/**
 * Inline form field errors from backend responses.
 *
 * Handles BOTH backend error shapes:
 *  1. Conflict-style errors with an explicit `field`
 *     (e.g. { error: 'EMAIL_ALREADY_EXISTS', field: 'email', message: '...' })
 *  2. class-validator VALIDATION_ERROR with `details.violations`
 *     (e.g. { error: 'VALIDATION_ERROR', details: { violations: ['email must be an email'] } })
 *     — each violation string starts with the field name, so we map it inline.
 *
 * Anything we can't attribute to a field falls back to a toast, so nothing
 * is ever silent.
 *
 * Usage:
 *   const fieldErrors = useFieldErrors();
 *   const mutation = useMutation({
 *     mutationFn: ...,
 *     meta: { skipGlobalError: true },
 *     onMutate: () => fieldErrors.clear(),
 *     onError: (err) => fieldErrors.handle(err),
 *     onSuccess: ...,
 *   });
 *   {fieldErrors.get("email") && <p className="text-xs text-destructive mt-1">{fieldErrors.get("email")}</p>}
 */
export function useFieldErrors() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clear = useCallback(() => setErrors({}), []);

  const handle = useCallback((error: unknown) => {
    if (!axios.isAxiosError(error) || !error.response?.data) {
      toast.error("An unexpected error occurred");
      return;
    }

    const data = error.response.data as {
      error?: string;
      message?: string;
      field?: string;
      details?: { violations?: string[] };
    };

    const next: Record<string, string> = {};

    // Case 1 — explicit field (conflicts like duplicate email)
    if (data.field && data.message) {
      next[data.field] = data.message;
    }

    // Case 2 — class-validator violations: "<field> <rest of message>"
    const violations = data.details?.violations;
    if (Array.isArray(violations)) {
      for (const v of violations) {
        const field = v.split(" ")[0]; // first word is the property name
        if (field && !next[field]) {
          // Capitalize the message for display
          next[field] = v.charAt(0).toUpperCase() + v.slice(1);
        }
      }
    }

    if (Object.keys(next).length > 0) {
      setErrors((prev) => ({ ...prev, ...next }));
    } else {
      // Couldn't attribute to any field — toast so it isn't silent.
      toast.error(data.message ?? "Something went wrong");
    }
  }, []);

  const get = useCallback((field: string) => errors[field], [errors]);

  return { errors, clear, handle, get };
}
