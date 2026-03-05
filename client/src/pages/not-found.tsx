import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-background">
      <Header />
      <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 4rem)" }}>
        <Card className="w-full max-w-md mx-4 bg-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2 items-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <h1 className="text-2xl font-bold text-foreground">404 Page Not Found</h1>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>

            <Link href="/">
              <Button variant="outline" className="mt-6">
                Back to Collection
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
}
