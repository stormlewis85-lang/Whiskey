import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Whiskey, UpdateWhiskey, updateWhiskeySchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface EditWhiskeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  whiskey: Whiskey;
}

const EditWhiskeyModal = ({ isOpen, onClose, whiskey }: EditWhiskeyModalProps) => {
  const { toast } = useToast();
  const [isBourbonSelected, setIsBourbonSelected] = useState(whiskey.type === "Bourbon" || whiskey.type === "Tennessee Whiskey");
  const [isFinishedSelected, setIsFinishedSelected] = useState(whiskey.finished === "Yes");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const form = useForm<UpdateWhiskey>({
    resolver: zodResolver(updateWhiskeySchema),
    defaultValues: {
      name: whiskey.name,
      distillery: whiskey.distillery || "",
      type: whiskey.type || "",
      age: whiskey.age || undefined,
      price: whiskey.price || undefined,
      abv: whiskey.abv || undefined,
      region: whiskey.region || "",
      // Keep the existing notes and ratings
      notes: whiskey.notes,
      rating: whiskey.rating,
      // Bourbon/whiskey categorization fields
      bottleType: whiskey.bottleType || "",
      mashBill: whiskey.mashBill || "",
      caskStrength: whiskey.caskStrength || "No",
      finished: whiskey.finished || "No",
      finishType: whiskey.finishType || "",
    },
  });

  const updateWhiskeyMutation = useMutation({
    mutationFn: async (data: UpdateWhiskey) => {
      const response = await apiRequest(
        "PATCH",
        `/api/whiskeys/${whiskey.id}`,
        data
      );
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Whiskey updated",
        description: "Your whiskey has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/whiskeys'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update whiskey: ${error}`,
        variant: "destructive",
      });
    },
  });

  const deleteWhiskeyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "DELETE",
        `/api/whiskeys/${whiskey.id}`
      );
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Whiskey deleted",
        description: "Your whiskey has been removed from your collection.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/whiskeys'] });
      setIsDeleteDialogOpen(false);
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete whiskey: ${error}`,
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
    },
  });

  // Monitor form changes to update conditional fields visibility
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "type") {
        setIsBourbonSelected(value.type === "Bourbon" || value.type === "Tennessee Whiskey");
      }
      if (name === "finished") {
        setIsFinishedSelected(value.finished === "Yes");
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const onSubmit = (data: UpdateWhiskey) => {
    updateWhiskeyMutation.mutate(data);
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteWhiskeyMutation.mutate();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Whiskey</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Basic whiskey info */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Buffalo Trace" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="distillery"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distillery</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Buffalo Trace Distillery" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select whiskey type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Bourbon">Bourbon</SelectItem>
                            <SelectItem value="Scotch">Scotch</SelectItem>
                            <SelectItem value="Rye">Rye</SelectItem>
                            <SelectItem value="Irish">Irish</SelectItem>
                            <SelectItem value="Japanese">Japanese</SelectItem>
                            <SelectItem value="Canadian">Canadian</SelectItem>
                            <SelectItem value="Tennessee Whiskey">Tennessee Whiskey</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age (Years)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            placeholder="e.g. 12" 
                            {...field}
                            value={field.value === undefined ? "" : field.value}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? undefined : Number(value));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01"
                            placeholder="e.g. 45.99" 
                            {...field}
                            value={field.value === undefined ? "" : field.value}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? undefined : Number(value));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="abv"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ABV (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="100" 
                            step="0.1"
                            placeholder="e.g. 46.5" 
                            {...field}
                            value={field.value === undefined ? "" : field.value}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? undefined : Number(value));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Kentucky, Speyside, etc." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Bourbon/whiskey specific fields */}
              {isBourbonSelected && (
                <div className="mt-3">
                  <Separator className="my-3" />
                  <h3 className="text-lg font-medium mb-3">Bourbon Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bottleType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bottle Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select bottle type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Single Barrel">Single Barrel</SelectItem>
                              <SelectItem value="Small Batch">Small Batch</SelectItem>
                              <SelectItem value="Blend">Blend</SelectItem>
                              <SelectItem value="none">None</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="mashBill"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mash Bill</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select mash bill" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="High Corn">High Corn</SelectItem>
                              <SelectItem value="High Rye">High Rye</SelectItem>
                              <SelectItem value="Wheated">Wheated</SelectItem>
                              <SelectItem value="none">None</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="caskStrength"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between space-x-2 space-y-0 rounded-md border p-3">
                          <FormLabel>Cask Strength</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value === "Yes"}
                              onCheckedChange={(checked) => 
                                field.onChange(checked ? "Yes" : "No")
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="finished"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between space-x-2 space-y-0 rounded-md border p-3">
                          <FormLabel>Finished</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value === "Yes"}
                              onCheckedChange={(checked) => 
                                field.onChange(checked ? "Yes" : "No")
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    {/* Finish Type - only show if Finished is Yes */}
                    {isFinishedSelected && (
                      <div className="col-span-1 md:col-span-2">
                        <FormField
                          control={form.control}
                          name="finishType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Finish Type</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="E.g., Port, Sherry, Wine, etc." 
                                  {...field} 
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex justify-between space-x-3">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-whiskey-600 hover:bg-whiskey-500 text-white"
                    disabled={updateWhiskeyMutation.isPending}
                  >
                    {updateWhiskeyMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{whiskey.name}" from your collection.
              {Array.isArray(whiskey.notes) && whiskey.notes.length > 0 && 
                ` All ${whiskey.notes.length} associated review${whiskey.notes.length === 1 ? '' : 's'} will also be deleted.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteWhiskeyMutation.isPending}
            >
              {deleteWhiskeyMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditWhiskeyModal;