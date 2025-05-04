import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Whiskey, ReviewNote, ReviewComment } from '@shared/schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MoreHorizontal, 
  Trash2, 
  Edit, 
  Send, 
  Check, 
  X
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

// Schema for comment creation/editing
const commentSchema = z.object({
  text: z.string().min(1, 'Comment cannot be empty').max(500, 'Comment is too long (max 500 characters)'),
});

type CommentFormValues = z.infer<typeof commentSchema>;

interface ReviewCommentsProps {
  whiskey: Whiskey;
  review: ReviewNote;
  className?: string;
}

const ReviewComments = ({ whiskey, review, className = '' }: ReviewCommentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  
  // Query to get comments
  const { 
    data: comments = [], 
    isLoading,
    error,
    refetch
  } = useQuery<ReviewComment[]>({
    queryKey: [`/api/whiskeys/${whiskey.id}/reviews/${review.id}/comments`],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!whiskey.id && !!review.id,
  });

  // Form for adding a new comment
  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      text: '',
    },
  });

  // Form for editing comments
  const editForm = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      text: '',
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (data: CommentFormValues) => {
      const response = await apiRequest(
        'POST',
        `/api/whiskeys/${whiskey.id}/reviews/${review.id}/comments`,
        { text: data.text }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Comment added',
        description: 'Your comment has been posted.',
      });
      form.reset();
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add comment: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Edit comment mutation
  const editCommentMutation = useMutation({
    mutationFn: async ({ id, text }: { id: number; text: string }) => {
      const response = await apiRequest(
        'PUT',
        `/api/comments/${id}`,
        { text }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Comment updated',
        description: 'Your comment has been updated.',
      });
      setEditingCommentId(null);
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update comment: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        'DELETE',
        `/api/comments/${id}`
      );
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Comment deleted',
        description: 'Your comment has been removed.',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete comment: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Handler for submitting a new comment
  const onSubmit = (values: CommentFormValues) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to post comments.',
        variant: 'destructive',
      });
      return;
    }
    
    addCommentMutation.mutate(values);
  };

  // Handler for editing a comment
  const startEditing = (comment: ReviewComment) => {
    editForm.reset({ text: comment.text });
    setEditingCommentId(comment.id);
  };

  // Handler for saving an edited comment
  const saveEdit = (id: number) => {
    const { text } = editForm.getValues();
    editCommentMutation.mutate({ id, text });
  };

  // Handler for cancelling an edit
  const cancelEdit = () => {
    setEditingCommentId(null);
  };

  // Handler for deleting a comment
  const deleteComment = (id: number) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(id);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get initials for avatar fallback
  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  if (error) {
    return (
      <div className={`${className} p-4 text-red-600 bg-red-50 rounded-lg`}>
        Failed to load comments. Please try again later.
      </div>
    );
  }

  return (
    <div className={`${className} space-y-6`}>
      <h3 className="text-xl font-semibold">Comments</h3>
      
      {/* Comment form */}
      {user && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <div className="flex gap-2">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="Add a comment..."
                          className="flex-1"
                          {...field}
                        />
                      </FormControl>
                      <Button 
                        type="submit" 
                        size="sm"
                        disabled={addCommentMutation.isPending}
                      >
                        {addCommentMutation.isPending ? (
                          <Skeleton className="h-4 w-4" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      )}
      
      {/* Comments list */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          ))
        ) : comments.length > 0 ? (
          // Comments list
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {getInitials(comment.username || 'User')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium text-sm">{comment.username}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  
                  {/* Comment actions (edit/delete) */}
                  {user && user.id === comment.userId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEditing(comment)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteComment(comment.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                
                {/* Comment content (normal or editing mode) */}
                {editingCommentId === comment.id ? (
                  <Form {...editForm}>
                    <form className="mt-1">
                      <FormField
                        control={editForm.control}
                        name="text"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <Button 
                                type="button" 
                                size="sm" 
                                variant="outline"
                                className="h-9 w-9 p-0"
                                onClick={() => saveEdit(comment.id)}
                                disabled={editCommentMutation.isPending}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                type="button" 
                                size="sm" 
                                variant="outline"
                                className="h-9 w-9 p-0"
                                onClick={cancelEdit}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                ) : (
                  <p className="text-sm mt-1">{comment.text}</p>
                )}
              </div>
            </div>
          ))
        ) : (
          // No comments
          <div className="text-center py-8 text-muted-foreground">
            <p>No comments yet.</p>
            {user && (
              <p className="text-sm mt-1">Be the first to share your thoughts!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewComments;