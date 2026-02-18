import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useSearch, Redirect } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, ArrowLeft, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const searchString = useSearch();
  const [token, setToken] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Extract token from URL
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    setToken(params.get("token"));
  }, [searchString]);

  // Validate token
  const { data: validation, isLoading: validating } = useQuery({
    queryKey: ["/api/auth/reset-password/validate", token],
    queryFn: async () => {
      if (!token) return { valid: false };
      const res = await fetch(`/api/auth/reset-password/validate?token=${token}`);
      return res.json() as Promise<{ valid: boolean; username?: string; message?: string }>;
    },
    enabled: !!token,
  });

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordValues) => {
      const res = await apiRequest("POST", "/api/auth/reset-password", {
        token,
        password: data.password,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to reset password");
      }
      return res.json();
    },
    onSuccess: () => {
      setSuccess(true);
    },
  });

  const onSubmit = (data: ResetPasswordValues) => {
    resetPasswordMutation.mutate(data);
  };

  // No token provided
  if (!token) {
    return <Redirect to="/auth" />;
  }

  // Loading validation
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Invalid or expired token
  if (validation && !validation.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-2">
              <Logo size="small" />
              <span className="text-xl font-heading text-[#D4A44C]">MyWhiskeyPedia</span>
            </Link>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl shadow-warm-lg p-8 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Invalid or Expired Link</h2>
            <p className="text-muted-foreground mb-6">
              This password reset link is no longer valid. It may have expired or already been used.
            </p>
            <div className="space-y-3">
              <Link href="/forgot-password">
                <Button className="w-full">Request a new reset link</Button>
              </Link>
              <Link href="/auth">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <Logo size="small" />
            <span className="text-xl font-heading text-[#D4A44C]">MyWhiskeyPedia</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-card border border-border/50 rounded-2xl shadow-warm-lg p-8">
          {success ? (
            // Success state
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Password reset complete</h2>
              <p className="text-muted-foreground mb-6">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <Link href="/auth">
                <Button className="w-full">Sign in</Button>
              </Link>
            </div>
          ) : (
            // Form state
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold">Create new password</h2>
                {validation?.username && (
                  <p className="text-muted-foreground text-sm mt-1">
                    for <span className="font-medium text-foreground">{validation.username}</span>
                  </p>
                )}
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="password"
                              placeholder="Min 8 chars, upper/lower/number"
                              className="h-11 pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="password"
                              placeholder="Re-enter your password"
                              className="h-11 pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {resetPasswordMutation.isError && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                      {(resetPasswordMutation.error as Error)?.message || "Failed to reset password. Please try again."}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      "Reset password"
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <Link
                  href="/auth"
                  className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
