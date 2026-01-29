import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import AuthPage from "@/pages/auth-page";
import SharedReview from "@/pages/SharedReview";
import Community from "@/pages/Community";
import ReviewPage from "@/pages/ReviewPage";
import Flights from "@/pages/Flights";
import BlindTastings from "@/pages/BlindTastings";
import Profile from "@/pages/Profile";
import { Toaster } from "@/components/ui/toaster";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/whiskey/:id/review/:reviewId" component={ReviewPage} />
      <ProtectedRoute path="/flights" component={Flights} />
      <ProtectedRoute path="/blind-tastings" component={BlindTastings} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/shared/:shareId" component={SharedReview} />
      <Route path="/community" component={Community} />
      <Route path="/u/:slug" component={Profile} />
      <Route component={NotFound} />
    </Switch>
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
            <Router />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
