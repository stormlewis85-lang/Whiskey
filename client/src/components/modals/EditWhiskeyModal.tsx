import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Whiskey, UpdateWhiskey, updateWhiskeySchema, bottleStatusValues } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Heart, Package, PackageOpen, Gift, CheckCircle2 } from "lucide-react";
import { DistilleryCombobox } from "@/components/DistilleryCombobox";
import AddDistilleryModal from "@/components/modals/AddDistilleryModal";

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
  const [isWishlistMode, setIsWishlistMode] = useState(whiskey.isWishlist === true);
  const [isAddDistilleryModalOpen, setIsAddDistilleryModalOpen] = useState(false);

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
      notes: whiskey.notes as any,
      rating: whiskey.rating,
      // Bourbon/whiskey categorization fields
      bottleType: whiskey.bottleType || "",
      mashBill: whiskey.mashBill || "",
      caskStrength: whiskey.caskStrength || "No",
      finished: whiskey.finished || "No",
      finishType: whiskey.finishType || "",
      // Collection management fields
      isWishlist: whiskey.isWishlist || false,
      status: whiskey.status || "sealed",
      quantity: whiskey.quantity || 1,
      purchaseDate: whiskey.purchaseDate || undefined,
      purchaseLocation: whiskey.purchaseLocation || "",
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
      try {
        const response = await apiRequest(
          "DELETE",
          `/api/whiskeys/${whiskey.id}`,
          undefined,
          {
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          }
        );
        return response;
      } catch (error) {
        console.error("Delete whiskey error:", error);
        throw error;
      }
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
      console.error("Delete whiskey mutation error:", error);
      
      let errorMessage = "Failed to delete whiskey";
      
      // Check for authentication errors
      if (error.message && error.message.includes("401")) {
        errorMessage = "Your session has expired. Please log in again to continue.";
        // Attempt to refresh the session
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      } else {
        errorMessage = `${errorMessage}: ${error.message || String(error)}`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      setIsDeleteDialogOpen(false);
    },
  });

  // Reset form when whiskey changes (fixes stale data when switching bottles)
  useEffect(() => {
    if (whiskey && isOpen) {
      form.reset({
        name: whiskey.name,
        distillery: whiskey.distillery || "",
        type: whiskey.type || "",
        age: whiskey.age || undefined,
        price: whiskey.price || undefined,
        abv: whiskey.abv || undefined,
        region: whiskey.region || "",
        notes: whiskey.notes as any,
        rating: whiskey.rating,
        bottleType: whiskey.bottleType || "",
        mashBill: whiskey.mashBill || "",
        caskStrength: whiskey.caskStrength || "No",
        finished: whiskey.finished || "No",
        finishType: whiskey.finishType || "",
        isWishlist: whiskey.isWishlist || false,
        status: whiskey.status || "sealed",
        quantity: whiskey.quantity || 1,
        purchaseDate: whiskey.purchaseDate || undefined,
        purchaseLocation: whiskey.purchaseLocation || "",
        distilleryId: whiskey.distilleryId || undefined,
      });
      // Update conditional state
      setIsBourbonSelected(whiskey.type === "Bourbon" || whiskey.type === "Tennessee Whiskey");
      setIsFinishedSelected(whiskey.finished === "Yes");
      setIsWishlistMode(whiskey.isWishlist === true);
    }
  }, [whiskey, isOpen, form]);

  // Monitor form changes to update conditional fields visibility
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "type") {
        setIsBourbonSelected(value.type === "Bourbon" || value.type === "Tennessee Whiskey");
      }
      if (name === "finished") {
        setIsFinishedSelected(value.finished === "Yes");
      }
      if (name === "isWishlist") {
        setIsWishlistMode(value.isWishlist === true);
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
                          <DistilleryCombobox
                            value={form.watch("distilleryId") as number | null | undefined}
                            onValueChange={(id, distillery) => {
                              form.setValue("distilleryId", id);
                              form.setValue("distillery", distillery?.name || "");
                            }}
                            onAddNew={() => setIsAddDistilleryModalOpen(true)}
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
                            value={field.value ?? ""}
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
                            value={field.value ?? ""}
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
                            value={field.value ?? ""}
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

              {/* Collection Management Section */}
              <div className="mt-4">
                <Separator className="my-4" />
                <h3 className="text-lg font-medium text-foreground mb-4">Collection Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Wishlist Toggle */}
                  <FormField
                    control={form.control}
                    name="isWishlist"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-pink-500/30 bg-pink-500/5 p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-pink-500" />
                            Wishlist Item
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Track bottles you want to buy
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value === true}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Quantity - only show if not wishlist */}
                  {!isWishlistMode && (
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="1"
                              {...field}
                              value={field.value || 1}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 1)}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Number of bottles owned
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Status - only show if not wishlist */}
                  {!isWishlistMode && (
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bottle Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "sealed"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sealed">
                                <span className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-blue-500" />
                                  Sealed
                                </span>
                              </SelectItem>
                              <SelectItem value="open">
                                <span className="flex items-center gap-2">
                                  <PackageOpen className="h-4 w-4 text-emerald-500" />
                                  Open
                                </span>
                              </SelectItem>
                              <SelectItem value="finished">
                                <span className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-slate-500" />
                                  Finished
                                </span>
                              </SelectItem>
                              <SelectItem value="gifted">
                                <span className="flex items-center gap-2">
                                  <Gift className="h-4 w-4 text-pink-500" />
                                  Gifted
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Purchase Date - only show if not wishlist */}
                  {!isWishlistMode && (
                    <FormField
                      control={form.control}
                      name="purchaseDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Purchase Location - only show if not wishlist */}
                  {!isWishlistMode && (
                    <FormField
                      control={form.control}
                      name="purchaseLocation"
                      render={({ field }) => (
                        <FormItem className="col-span-1 md:col-span-2">
                          <FormLabel>Purchase Location</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Store name or location"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

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

      {/* Add Distillery Modal */}
      <AddDistilleryModal
        isOpen={isAddDistilleryModalOpen}
        onClose={() => setIsAddDistilleryModalOpen(false)}
        onDistilleryCreated={(distillery) => {
          form.setValue("distilleryId", distillery.id);
          form.setValue("distillery", distillery.name);
        }}
      />
    </>
  );
};

export default EditWhiskeyModal;