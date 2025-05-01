import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { InsertWhiskey, insertWhiskeySchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface AddWhiskeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddWhiskeyModal = ({ isOpen, onClose }: AddWhiskeyModalProps) => {
  const { toast } = useToast();
  const [isBourbonSelected, setIsBourbonSelected] = useState(false);
  const [isFinishedSelected, setIsFinishedSelected] = useState(false);
  
  const form = useForm<InsertWhiskey>({
    resolver: zodResolver(insertWhiskeySchema),
    defaultValues: {
      name: "",
      distillery: "",
      type: "",
      age: undefined,
      price: undefined,
      abv: undefined,
      region: "",
      rating: 0,
      notes: [],
      // New bourbon/whiskey categorization fields
      bottleType: "",
      mashBill: "",
      caskStrength: "No",
      finished: "No",
      finishType: "",
    },
  });

  const addWhiskeyMutation = useMutation({
    mutationFn: async (data: InsertWhiskey) => {
      const response = await apiRequest(
        "POST",
        "/api/whiskeys",
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whiskeys"] });
      toast({
        title: "Whiskey Added",
        description: "Your whiskey has been added to the collection.",
      });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add whiskey: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Watch for changes to whiskey type and finished selection
  useEffect(() => {
    // Get the current type value
    const watchType = form.watch("type");
    // Set the bourbon flag when the type is Bourbon or Tennessee Whiskey
    // Both types need the same special fields
    setIsBourbonSelected(watchType === "Bourbon" || watchType === "Tennessee Whiskey");
    
    // Get the current finished value
    const watchFinished = form.watch("finished");
    // Set the finished flag
    setIsFinishedSelected(watchFinished === "Yes");
  }, [form.watch]);

  const onSubmit = (data: InsertWhiskey) => {
    addWhiskeyMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-[#F5F5F0]">Add New Whiskey</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto pr-2 max-h-[calc(85vh-120px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter whiskey name" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="distillery"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distillery</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter distillery" 
                        {...field} 
                        value={field.value || ""}
                      />
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
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Select Type</SelectItem>
                        <SelectItem value="Bourbon">Bourbon</SelectItem>
                        <SelectItem value="Tennessee Whiskey">Tennessee Whiskey</SelectItem>
                        <SelectItem value="Scotch">Scotch</SelectItem>
                        <SelectItem value="Rye">Rye</SelectItem>
                        <SelectItem value="Irish">Irish</SelectItem>
                        <SelectItem value="Japanese">Japanese</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                        placeholder="Enter age" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
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
                        placeholder="Enter price" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
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
                        placeholder="Enter ABV" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter region" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Bourbon/Tennessee Whiskey-specific fields */}
            {isBourbonSelected && (
              <div className="mt-4">
                <Separator className="my-4" />
                <h3 className="text-lg font-medium text-[#F5F5F0] mb-4">Whiskey Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bottle Type */}
                  <FormField
                    control={form.control}
                    name="bottleType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bottle Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Bottle Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Select Type</SelectItem>
                            <SelectItem value="Single Barrel">Single Barrel</SelectItem>
                            <SelectItem value="Small Batch">Small Batch</SelectItem>
                            <SelectItem value="Blend">Blend</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Mash Bill */}
                  <FormField
                    control={form.control}
                    name="mashBill"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mash Bill</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Mash Bill" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Select Mash Bill</SelectItem>
                            <SelectItem value="High Corn">High Corn</SelectItem>
                            <SelectItem value="High Rye">High Rye</SelectItem>
                            <SelectItem value="Wheated">Wheated</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Cask Strength */}
                  <FormField
                    control={form.control}
                    name="caskStrength"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Cask Strength</FormLabel>
                        </div>
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
                  
                  {/* Finished */}
                  <FormField
                    control={form.control}
                    name="finished"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Finished</FormLabel>
                        </div>
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
            
            <div className="mt-6 flex justify-end space-x-3">
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
                disabled={addWhiskeyMutation.isPending}
              >
                {addWhiskeyMutation.isPending ? "Adding..." : "Add to Collection"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddWhiskeyModal;
