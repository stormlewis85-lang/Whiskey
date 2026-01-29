import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Simplified form schema for quick distillery creation
const addDistillerySchema = z.object({
  name: z.string().min(1, "Distillery name is required"),
  location: z.string().optional(),
  country: z.string().optional(),
  type: z.string().optional(),
  parentCompany: z.string().optional(),
});

type AddDistilleryFormValues = z.infer<typeof addDistillerySchema>;

interface Distillery {
  id: number;
  name: string;
  location: string | null;
  country: string | null;
  region: string | null;
  type: string | null;
  yearFounded: number | null;
  parentCompany: string | null;
  website: string | null;
  description: string | null;
}

interface AddDistilleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDistilleryCreated?: (distillery: Distillery) => void;
}

const AddDistilleryModal = ({ isOpen, onClose, onDistilleryCreated }: AddDistilleryModalProps) => {
  const { toast } = useToast();

  const form = useForm<AddDistilleryFormValues>({
    resolver: zodResolver(addDistillerySchema),
    defaultValues: {
      name: "",
      location: "",
      country: "",
      type: "",
      parentCompany: "",
    },
  });

  const createDistilleryMutation = useMutation({
    mutationFn: async (data: AddDistilleryFormValues) => {
      const response = await apiRequest("POST", "/api/distilleries", data);
      return response.json();
    },
    onSuccess: (newDistillery: Distillery) => {
      toast({
        title: "Distillery Added",
        description: `${newDistillery.name} has been added to the database.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/distilleries"] });
      form.reset();
      if (onDistilleryCreated) {
        onDistilleryCreated(newDistillery);
      }
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add distillery: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddDistilleryFormValues) => {
    createDistilleryMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Distillery</DialogTitle>
          <DialogDescription>
            Add a new distillery to the database. Only the name is required.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Distillery Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Buffalo Trace Distillery" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Frankfort, Kentucky" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USA">USA</SelectItem>
                      <SelectItem value="Scotland">Scotland</SelectItem>
                      <SelectItem value="Ireland">Ireland</SelectItem>
                      <SelectItem value="Japan">Japan</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="Taiwan">Taiwan</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Spirit Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Bourbon">Bourbon</SelectItem>
                      <SelectItem value="Tennessee Whiskey">Tennessee Whiskey</SelectItem>
                      <SelectItem value="Rye">Rye</SelectItem>
                      <SelectItem value="Scotch">Scotch</SelectItem>
                      <SelectItem value="Irish">Irish</SelectItem>
                      <SelectItem value="Japanese">Japanese</SelectItem>
                      <SelectItem value="Canadian">Canadian</SelectItem>
                      <SelectItem value="Single Malt">Single Malt</SelectItem>
                      <SelectItem value="Blended">Blended</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentCompany"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Company</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Sazerac, Brown-Forman" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createDistilleryMutation.isPending}>
                {createDistilleryMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Distillery
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDistilleryModal;
