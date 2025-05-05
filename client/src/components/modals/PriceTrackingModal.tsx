import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Whiskey, insertPriceTrackSchema, PriceTrack } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface PriceTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  whiskey: Whiskey;
}

const priceTrackSchema = insertPriceTrackSchema
  .extend({
    date: z.date({ required_error: "A date is required" }),
  })
  .omit({ userId: true, whiskeyId: true, createdAt: true });

type PriceTrackFormValues = z.infer<typeof priceTrackSchema>;

export default function PriceTrackingModal({
  isOpen,
  onClose,
  whiskey,
}: PriceTrackingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Fetch price history for this whiskey
  const { data: priceHistory, isLoading, isError } = useQuery<PriceTrack[]>({
    queryKey: ["/api/whiskeys", whiskey.id, "prices"],
    enabled: isOpen,
  });
  
  // Form for adding a new price entry
  const form = useForm<PriceTrackFormValues>({
    resolver: zodResolver(priceTrackSchema),
    defaultValues: {
      price: whiskey.price || 0,
      store: "",
      location: "",
      date: new Date(),
      url: "",
      isAvailable: true,
    },
  });
  
  // Mutation for adding price track
  const addPriceTrackMutation = useMutation({
    mutationFn: async (values: PriceTrackFormValues) => {
      const res = await apiRequest(
        "POST",
        `/api/whiskeys/${whiskey.id}/prices`,
        values
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Price added",
        description: "Price information has been added to tracking",
      });
      form.reset();
      setShowAddForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/whiskeys", whiskey.id, "prices"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete price track mutation
  const deletePriceTrackMutation = useMutation({
    mutationFn: async (priceId: number) => {
      const res = await apiRequest(
        "DELETE",
        `/api/whiskeys/${whiskey.id}/prices/${priceId}`
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Price deleted",
        description: "Price entry has been removed from tracking",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/whiskeys", whiskey.id, "prices"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: PriceTrackFormValues) => {
    addPriceTrackMutation.mutate(values);
  };
  
  const formatPriceData = (prices: PriceTrack[]) => {
    if (!prices) return [];
    
    return prices.map(price => ({
      date: format(new Date(price.date), 'MMM dd, yyyy'),
      price: price.price,
    })).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return isNaN(dateA.getTime()) ? 1 : isNaN(dateB.getTime()) ? -1 : dateA.getTime() - dateB.getTime();
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Price Tracking - {whiskey.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Price History Chart */}
          {priceHistory && priceHistory.length > 1 ? (
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Price History</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formatPriceData(priceHistory)}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }} 
                      tickFormatter={(value) => value.split(',')[0]}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                      name="Price ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="text-center p-6 bg-slate-50 rounded-lg">
              <p className="text-slate-500">
                {isLoading ? "Loading price data..." : "No price history data yet. Start tracking prices below."}
              </p>
            </div>
          )}
          
          {/* Price History Table */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Price Entries</h3>
              <Button 
                variant="outline" 
                onClick={() => setShowAddForm(!showAddForm)}
                size="sm"
              >
                {showAddForm ? "Cancel" : "Add Price Entry"}
              </Button>
            </div>
            
            {/* Add Price Form */}
            {showAddForm && (
              <div className="bg-slate-50 p-4 rounded-lg mb-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="store"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Store</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL (optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isAvailable"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Currently available</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={addPriceTrackMutation.isPending}
                    >
                      {addPriceTrackMutation.isPending ? "Adding..." : "Add Price"}
                    </Button>
                  </form>
                </Form>
              </div>
            )}
            
            {/* Price Entry List */}
            {isLoading ? (
              <div className="text-center p-4">Loading price data...</div>
            ) : priceHistory && priceHistory.length > 0 ? (
              <div className="border rounded-md">
                <div className="grid grid-cols-5 bg-slate-100 p-2 font-semibold text-sm">
                  <div>Date</div>
                  <div>Price</div>
                  <div>Store</div>
                  <div>Location</div>
                  <div>Actions</div>
                </div>
                <Separator />
                
                {[...priceHistory]
                  .sort((a, b) => {
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    return isNaN(dateB.getTime()) ? -1 : isNaN(dateA.getTime()) ? 1 : dateB.getTime() - dateA.getTime();
                  })
                  .map((price) => (
                    <div key={price.id} className="grid grid-cols-5 p-2 text-sm hover:bg-slate-50">
                      <div>
                        {(() => {
                          try {
                            return format(new Date(price.date), 'MMM dd, yyyy');
                          } catch (error) {
                            return 'Invalid date';
                          }
                        })()}
                      </div>
                      <div>${price.price.toFixed(2)}</div>
                      <div>{price.store || '-'}</div>
                      <div>{price.location || '-'}</div>
                      <div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePriceTrackMutation.mutate(price.id)}
                          disabled={deletePriceTrackMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <Separator className="col-span-5 my-1" />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center p-4 text-slate-500">
                No price entries found
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}