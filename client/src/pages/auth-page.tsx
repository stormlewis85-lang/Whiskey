import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Redirect, Link, useSearch } from "wouter";
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
import { Loader2, ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

// Google icon component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(1, "Password is required"),
});

// Stronger password requirements for registration
const registerSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [betaCode, setBetaCode] = useState("");
  const [betaValidated, setBetaValidated] = useState(false);
  const [betaError, setBetaError] = useState<string | null>(null);
  const [showBetaOnLogin, setShowBetaOnLogin] = useState(false);
  const searchString = useSearch();

  // Check for OAuth errors in URL
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const error = params.get("error");
    if (error) {
      const errorMessages: Record<string, string> = {
        oauth_denied: "Google sign-in was cancelled",
        invalid_state: "Security validation failed. Please try again.",
        oauth_failed: "Google sign-in failed. Please try again.",
        token_exchange_failed: "Failed to complete sign-in. Please try again.",
        session_failed: "Failed to create session. Please try again.",
        beta_required: "Beta access required. Please enter your invite code first.",
      };
      setOauthError(errorMessages[error] || "Sign-in failed. Please try again.");
      // Clear the error from URL
      window.history.replaceState({}, "", "/auth");
    }
  }, [searchString]);

  // Check if Google OAuth is configured
  const { data: googleStatus } = useQuery({
    queryKey: ["/api/auth/google/status"],
    queryFn: async () => {
      const res = await fetch("/api/auth/google/status");
      return res.json() as Promise<{ configured: boolean }>;
    },
  });

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      displayName: "",
      email: "",
    },
  });

  const onLogin = (data: LoginFormValues) => {
    setOauthError(null);
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterFormValues) => {
    setOauthError(null);
    // Filter out empty email, include beta code
    const submitData = {
      ...data,
      email: data.email || undefined,
      betaCode: betaCode.trim(),
    };
    registerMutation.mutate(submitData);
  };

  const handleGoogleSignIn = async () => {
    setOauthError(null);
    // Store beta code in session before OAuth redirect
    if (betaCode.trim()) {
      try {
        await fetch("/api/auth/beta-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: betaCode.trim() }),
        });
      } catch {
        // Continue anyway — backend will validate
      }
    }
    window.location.href = "/api/auth/google";
  };

  // If already logged in, redirect to home
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left side - V2 brand panel */}
      <div className="relative lg:flex-1 lg:flex lg:flex-col lg:justify-center px-6 py-12 lg:px-16 overflow-hidden" style={{ backgroundColor: "hsl(var(--background))" }}>
        {/* Subtle ambient gold glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-[0.06]" style={{ background: "radial-gradient(ellipse at center, hsl(var(--primary)), transparent 70%)" }} />

        <div className="relative z-10 max-w-lg mx-auto lg:mx-0">
          {/* Logo — restrained */}
          <div className="flex items-center gap-3 mb-12">
            <Logo size="small" className="w-10 h-10" />
            <span className="text-lg font-heading text-primary tracking-tight">MyWhiskeyPedia</span>
          </div>

          {/* Single Playfair headline */}
          <h1 className="font-display text-foreground leading-[1.1] tracking-tight" style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}>
            Every bottle has a story worth keeping.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-md">
            Every bottle, every pour, every note — finally somewhere worth keeping them.
          </p>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
              <Logo size="small" />
              <span className="text-xl font-heading text-[#D4A44C]">MyWhiskeyPedia</span>
            </div>
          </div>

          {/* Form card */}
          <div className="bg-card border border-border/50 rounded-2xl shadow-warm-lg p-8">
            {/* Toggle */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg mb-8">
              <button
                onClick={() => setIsLogin(true)}
                className={cn(
                  "flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200",
                  isLogin
                    ? "bg-background text-foreground shadow-warm-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={cn(
                  "flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200",
                  !isLogin
                    ? "bg-background text-foreground shadow-warm-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Create Account
              </button>
            </div>

            {/* Forms with animation */}
            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-foreground">Welcome back</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Sign in to access your collection
                    </p>
                  </div>

                  {/* Collapsed beta code disclosure */}
                  <div className="mb-4">
                    {showBetaOnLogin ? (
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          Beta Invite Code
                        </label>
                        <Input
                          placeholder="Enter your invite code"
                          value={betaCode}
                          onChange={(e) => setBetaCode(e.target.value)}
                          className="h-11"
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowBetaOnLogin(true)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                      >
                        Have an invite code? Enter it
                      </button>
                    )}
                  </div>

                  {/* Google OAuth Button */}
                  {googleStatus?.configured && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 mb-4"
                        onClick={handleGoogleSignIn}
                      >
                        <GoogleIcon className="mr-2 h-5 w-5" />
                        Continue with Google
                      </Button>

                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">
                            Or continue with username
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* OAuth error message */}
                  {oauthError && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-4">
                      {oauthError}
                    </div>
                  )}

                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your username"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel>Password</FormLabel>
                              <Link
                                href="/forgot-password"
                                className="text-sm text-foreground hover:underline"
                              >
                                Forgot password?
                              </Link>
                            </div>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Enter your password"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {loginMutation.isError && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                          {(loginMutation.error as any)?.message || "Invalid username or password. Please try again."}
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full h-11 mt-2"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          <>
                            Sign In
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>

                  <p className="text-center text-sm text-muted-foreground mt-6">
                    Don't have an account?{" "}
                    <button
                      onClick={() => setIsLogin(false)}
                      className="text-foreground hover:underline font-medium"
                    >
                      Create one
                    </button>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-foreground">Create your account</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Beta access is invite-only
                    </p>
                  </div>

                  {/* Beta code input */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Beta Invite Code
                    </label>
                    <Input
                      placeholder="Enter your invite code"
                      value={betaCode}
                      onChange={(e) => setBetaCode(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  {/* Google OAuth Button */}
                  {googleStatus?.configured && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 mb-4"
                        onClick={handleGoogleSignIn}
                      >
                        <GoogleIcon className="mr-2 h-5 w-5" />
                        Continue with Google
                      </Button>

                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">
                            Or create with username
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* OAuth error message */}
                  {oauthError && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-4">
                      {oauthError}
                    </div>
                  )}

                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="What should we call you?"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="For password recovery"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Choose a username"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Min 8 chars, upper/lower/number"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {registerMutation.isError && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                          {(registerMutation.error as any)?.message || "Could not create account. Username may already be taken."}
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full h-11 mt-2"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          <>
                            Create Account
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>

                  <p className="text-center text-sm text-muted-foreground mt-6">
                    Already have an account?{" "}
                    <button
                      onClick={() => setIsLogin(true)}
                      className="text-foreground hover:underline font-medium"
                    >
                      Sign in
                    </button>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            By continuing, you agree to enjoy whiskey responsibly.
          </p>
        </div>
      </div>
    </div>
  );
}
