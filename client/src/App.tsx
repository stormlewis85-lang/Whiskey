import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { ProtectedRoute } from "@/lib/protected-route";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { MobileShell } from "@/components/MobileShell";
import { ProfileRedirect } from "@/components/ProfileRedirect";

// Lazy-loaded pages for code splitting
const Home = lazy(() => import("@/pages/Home"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password"));
const ResetPasswordPage = lazy(() => import("@/pages/reset-password"));
const SharedReview = lazy(() => import("@/pages/SharedReview"));
const Community = lazy(() => import("@/pages/Community"));
const ReviewPage = lazy(() => import("@/pages/ReviewPage"));
const Flights = lazy(() => import("@/pages/Flights"));
const BlindTastings = lazy(() => import("@/pages/BlindTastings"));
const RickHouse = lazy(() => import("@/pages/RickHouse"));
const Profile = lazy(() => import("@/pages/Profile"));
const Drops = lazy(() => import("@/pages/Drops"));
const StoreProfile = lazy(() => import("@/pages/StoreProfile"));
const StoreEdit = lazy(() => import("@/pages/StoreEdit"));
const StoreAnalytics = lazy(() => import("@/pages/StoreAnalytics"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const Clubs = lazy(() => import("@/pages/Clubs"));
const ClubDetail = lazy(() => import("@/pages/ClubDetail"));
const ClubSession = lazy(() => import("@/pages/ClubSession"));
const PalateMatches = lazy(() => import("@/pages/PalateMatches"));
const TradeListings = lazy(() => import("@/pages/TradeListings"));
const CollectionCompare = lazy(() => import("@/pages/CollectionCompare"));
const Challenges = lazy(() => import("@/pages/Challenges"));
const ProgressPage = lazy(() => import("@/pages/ProgressPage"));
const PalateExercises = lazy(() => import("@/pages/PalateExercises"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div
          className="animate-spin rounded-full border-2 border-muted border-t-primary"
          style={{ width: "32px", height: "32px" }}
        />
        <span className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>
          Loading...
        </span>
      </div>
    </div>
  );
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ScrollToTop />
      <Switch>
        <ProtectedRoute path="/" component={Home} />
        <ProtectedRoute path="/dashboard" component={Dashboard} />
        <ProtectedRoute path="/whiskey/:id/review/:reviewId" component={ReviewPage} />
        <ProtectedRoute path="/flights" component={Flights} />
        <ProtectedRoute path="/blind-tastings" component={BlindTastings} />
        <ProtectedRoute path="/rick-house" component={RickHouse} />
        <ProtectedRoute path="/clubs" component={Clubs} />
        <ProtectedRoute path="/clubs/:clubId" component={ClubDetail} />
        <ProtectedRoute path="/clubs/:clubId/sessions/:sessionId" component={ClubSession} />
        <ProtectedRoute path="/palate-matches" component={PalateMatches} />
        <Route path="/trades" component={TradeListings} />
        <ProtectedRoute path="/compare/:userId" component={CollectionCompare} />
        <ProtectedRoute path="/challenges" component={Challenges} />
        <ProtectedRoute path="/progress" component={ProgressPage} />
        <ProtectedRoute path="/exercises" component={PalateExercises} />
        <ProtectedRoute path="/analytics" component={Analytics} />
        <ProtectedRoute path="/drops" component={Drops} />
        <Route path="/store/:id" component={StoreProfile} />
        <ProtectedRoute path="/store/:id/edit" component={StoreEdit} />
        <ProtectedRoute path="/store/:id/analytics" component={StoreAnalytics} />
        <ProtectedRoute path="/search" component={Community} />
        <ProtectedRoute path="/profile" component={ProfileRedirect} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/shared/:shareId" component={SharedReview} />
        <Route path="/community" component={Community} />
        <Route path="/u/:slug" component={Profile} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <ErrorBoundary>
              <MobileShell>
                <Router />
              </MobileShell>
            </ErrorBoundary>
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
