import { useState, lazy, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Whiskey } from "@shared/schema";
import { Mic, Clock, BookOpen, Play } from "lucide-react";
import { format } from "date-fns";

const TastingModeModal = lazy(() => import("@/components/modals/TastingModeModal"));
const TastingSession = lazy(() => import("@/components/TastingSession"));
const RickErrorBoundary = lazy(() => import("@/components/RickErrorBoundary"));

interface SessionHistoryItem {
  id: number;
  whiskeyId: number;
  whiskeyName: string;
  mode: 'guided' | 'notes';
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

const RickHouse = () => {
  const queryClient = useQueryClient();

  // Tasting flow state
  const [isTastingModeModalOpen, setIsTastingModeModalOpen] = useState(false);
  const [isTastingSessionActive, setIsTastingSessionActive] = useState(false);
  const [tastingMode, setTastingMode] = useState<'guided' | 'notes'>('guided');
  const [selectedWhiskeyId, setSelectedWhiskeyId] = useState<string>("");

  // Data queries
  const { data: sessions, isLoading: sessionsLoading } = useQuery<SessionHistoryItem[]>({
    queryKey: ["/api/rick/sessions"],
  });

  const { data: whiskeys } = useQuery<Whiskey[]>({
    queryKey: ["/api/whiskeys"],
  });

  const selectedWhiskey = whiskeys?.find(w => w.id === parseInt(selectedWhiskeyId)) || null;
  const availableWhiskeys = whiskeys?.filter(w => !w.isWishlist) || [];

  const handleSessionEnd = () => {
    setIsTastingSessionActive(false);
    queryClient.invalidateQueries({ queryKey: ["/api/rick/sessions"] });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page Header */}
      <header className="relative py-6 md:py-8 lg:py-10">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-label-caps text-amber-600 dark:text-amber-400 mb-3">
            AI-Guided Tasting
          </p>
          <h1 className="text-display-hero text-foreground">Rick House</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl hidden sm:block">
            Let Rick guide you through a tasting. A retired master distiller with 42 years
            in the bourbon industry, he'll walk you through what to look for — or just
            give you the highlights.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8">
        {/* Start a Tasting */}
        <Card className="border-amber-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mic className="h-5 w-5 text-amber-500" />
              Start a Tasting
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableWhiskeys.length === 0 ? (
              <p className="text-muted-foreground">
                Add whiskeys to your collection first, then come back to taste with Rick.
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                <div className="flex-1 w-full">
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Choose a bottle
                  </label>
                  <Select value={selectedWhiskeyId} onValueChange={setSelectedWhiskeyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a whiskey..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableWhiskeys.map(w => (
                        <SelectItem key={w.id} value={String(w.id)}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => setIsTastingModeModalOpen(true)}
                  disabled={!selectedWhiskey}
                  className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Taste with Rick
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tastings */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Tastings</h2>

          {sessionsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-muted-foreground" />
            </div>
          ) : !sessions || sessions.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <Mic className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No tastings yet. Select a bottle above to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session) => (
                <Card key={session.id} className="border-border/50 hover:border-amber-500/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-foreground line-clamp-1">
                        {session.whiskeyName}
                      </h3>
                      {session.completedAt ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shrink-0">
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shrink-0">
                          In Progress
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {session.mode === 'guided' ? (
                          <BookOpen className="h-3.5 w-3.5" />
                        ) : (
                          <Mic className="h-3.5 w-3.5" />
                        )}
                        <span>{session.mode === 'guided' ? 'Guided' : 'Quick Notes'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {(() => {
                            try {
                              return format(new Date(session.startedAt), 'MMM d, yyyy');
                            } catch {
                              return 'Unknown date';
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Tasting Flow */}
      {selectedWhiskey && (
        <>
          <Suspense fallback={null}>
            <TastingModeModal
              isOpen={isTastingModeModalOpen}
              onClose={() => setIsTastingModeModalOpen(false)}
              whiskey={selectedWhiskey}
              onSelectMode={(mode) => {
                setTastingMode(mode);
                setIsTastingModeModalOpen(false);
                setIsTastingSessionActive(true);
              }}
            />
          </Suspense>

          {isTastingSessionActive && (
            <Suspense fallback={
              <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-pulse text-muted-foreground">Loading Rick House...</div>
                </div>
              </div>
            }>
              <RickErrorBoundary
                onClose={handleSessionEnd}
                onRetry={() => {
                  setIsTastingSessionActive(false);
                  setTimeout(() => setIsTastingSessionActive(true), 100);
                }}
              >
                <TastingSession
                  whiskey={selectedWhiskey}
                  mode={tastingMode}
                  onClose={handleSessionEnd}
                  onComplete={handleSessionEnd}
                />
              </RickErrorBoundary>
            </Suspense>
          )}
        </>
      )}
    </div>
  );
};

export default RickHouse;
