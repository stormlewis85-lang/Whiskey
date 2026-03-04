import React from 'react';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Zap,
  Brain,
  Eye,
  Ear,
  Palette,
  Target,
  Loader2,
  CheckCircle2,
  Sparkles,
  ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PalateExercise {
  id: number;
  userId: number;
  title: string;
  description: string;
  exerciseType: string;
  difficulty: string;
  instructions: string[];
  targetFlavors: string[] | null;
  whiskeyIds: number[] | null;
  isCompleted: boolean;
  completedAt: string | null;
  userNotes: string | null;
  createdAt: string;
}

const exerciseTypeIcons: Record<string, React.ReactNode> = {
  nose_training: <Ear className="h-5 w-5 text-violet-400" />,
  blind_comparison: <Eye className="h-5 w-5 text-blue-400" />,
  flavor_isolation: <Target className="h-5 w-5 text-emerald-400" />,
  palate_calibration: <Brain className="h-5 w-5 text-amber-400" />,
};

const exerciseTypeLabels: Record<string, string> = {
  nose_training: 'Nose Training',
  blind_comparison: 'Blind Comparison',
  flavor_isolation: 'Flavor Isolation',
  palate_calibration: 'Palate Calibration',
};

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  advanced: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  expert: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function ExerciseCard({ exercise, onComplete }: {
  exercise: PalateExercise;
  onComplete?: (id: number) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const instructions = Array.isArray(exercise.instructions) ? exercise.instructions : [];

  return (
    <Card className={cn(
      "bg-card/50 border-border/30 transition-colors",
      exercise.isCompleted && "border-emerald-500/20 bg-emerald-500/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {exercise.isCompleted
              ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              : exerciseTypeIcons[exercise.exerciseType] || <Zap className="h-5 w-5 text-amber-400" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-sm">{exercise.title}</h3>
              <Badge variant="outline" className={cn('text-[10px]', difficultyColors[exercise.difficulty])}>
                {exercise.difficulty}
              </Badge>
              <Badge variant="outline" className="text-[10px] border-border/50 text-muted-foreground">
                {exerciseTypeLabels[exercise.exerciseType] || exercise.exerciseType}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{exercise.description}</p>

            {exercise.targetFlavors && exercise.targetFlavors.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {exercise.targetFlavors.map(flavor => (
                  <Badge key={flavor} variant="outline" className="text-[10px] border-primary/30 text-primary/80">
                    {flavor}
                  </Badge>
                ))}
              </div>
            )}

            {expanded && instructions.length > 0 && (
              <div className="mt-3 space-y-2 bg-background/50 rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <ListChecks className="h-3.5 w-3.5" />
                  Instructions
                </p>
                <ol className="space-y-1.5">
                  {instructions.map((step: string, i: number) => (
                    <li key={i} className="text-xs text-foreground/80 flex gap-2">
                      <span className="text-muted-foreground font-mono shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="h-7 text-xs text-muted-foreground"
              >
                {expanded ? 'Hide Steps' : 'View Steps'}
              </Button>
              {!exercise.isCompleted && onComplete && (
                <Button
                  size="sm"
                  onClick={() => onComplete(exercise.id)}
                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Mark Complete
                </Button>
              )}
            </div>

            {exercise.isCompleted && exercise.completedAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Completed {new Date(exercise.completedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PalateExercises() {
  const { toast } = useToast();

  const { data: activeExercises, isLoading: loadingActive } = useQuery<PalateExercise[]>({
    queryKey: ['/api/exercises', 'active'],
    queryFn: () => apiRequest('GET', '/api/exercises?completed=false').then(r => r.json()),
  });

  const { data: completedExercises, isLoading: loadingCompleted } = useQuery<PalateExercise[]>({
    queryKey: ['/api/exercises', 'completed'],
    queryFn: () => apiRequest('GET', '/api/exercises?completed=true').then(r => r.json()),
  });

  const generateMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/exercises/generate'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
      toast({ title: 'Exercise generated!', description: 'Rick created a new exercise for you.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message || 'Failed to generate exercise', variant: 'destructive' });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => apiRequest('POST', `/api/exercises/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      toast({ title: 'Exercise completed!', description: '+30 XP earned' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message || 'Failed to complete exercise', variant: 'destructive' });
    },
  });

  return (
    <>
      <Helmet><title>Palate Exercises | WhiskeyPedia</title></Helmet>
      <Header />
      <main className="container mx-auto px-4 py-6 pb-24 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="h-7 w-7 text-amber-400" />
          <div className="flex-1">
            <h1 className="text-xl font-bold">Palate Exercises</h1>
            <p className="text-sm text-muted-foreground">AI-generated training from Rick</p>
          </div>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="gap-1.5 bg-primary/80 hover:bg-primary"
            size="sm"
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate
          </Button>
        </div>

        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">
              Active {activeExercises?.length ? `(${activeExercises.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed {completedExercises?.length ? `(${completedExercises.length})` : ''}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3">
            {loadingActive ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))
            ) : !activeExercises?.length ? (
              <Card className="bg-card/30 border-border/20">
                <CardContent className="p-8 text-center">
                  <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">No exercises yet. Let Rick create one for you!</p>
                  <Button
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                    className="gap-1.5"
                    size="sm"
                  >
                    {generateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Generate Exercise
                  </Button>
                </CardContent>
              </Card>
            ) : (
              activeExercises.map(ex => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  onComplete={completeMutation.mutate}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3">
            {loadingCompleted ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))
            ) : !completedExercises?.length ? (
              <Card className="bg-card/30 border-border/20">
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Complete exercises to see them here.</p>
                </CardContent>
              </Card>
            ) : (
              completedExercises.map(ex => (
                <ExerciseCard key={ex.id} exercise={ex} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
