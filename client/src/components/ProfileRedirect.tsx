import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export function ProfileRedirect() {
  const { user } = useAuth();

  const slug = (user as any)?.profileSlug || user?.username;
  if (slug) {
    return <Redirect to={`/u/${slug}`} />;
  }

  // Fallback: redirect home if no slug available
  return <Redirect to="/" />;
}
