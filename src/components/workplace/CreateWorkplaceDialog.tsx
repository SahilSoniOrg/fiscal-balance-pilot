
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useWorkplace } from "@/context/WorkplaceContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Workplace } from "@/lib/types";
import { Loader2 } from "lucide-react";

const workplaceSchema = z.object({
  name: z.string().min(1, "Workplace name is required"),
  description: z.string().optional(),
  defaultCurrencyCode: z.string().min(1, "Default currency is required"),
});

type WorkplaceFormValues = z.infer<typeof workplaceSchema>;

interface CreateWorkplaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateWorkplaceDialog: React.FC<CreateWorkplaceDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { createWorkplace, selectWorkplace, state } = useWorkplace();
  const { state: currencyState, fetchCurrencies } = useCurrency();
  
  // Fetch currencies when the dialog opens
  useEffect(() => {
    if (open && currencyState.currencies.length === 0 && !currencyState.isLoading) {
      fetchCurrencies();
    }
  }, [open, currencyState.currencies.length, currencyState.isLoading, fetchCurrencies]);
  
  const form = useForm<WorkplaceFormValues>({
    resolver: zodResolver(workplaceSchema),
    defaultValues: {
      name: "",
      description: "",
      defaultCurrencyCode: "USD", // Default to USD
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: WorkplaceFormValues) => {
    try {
      const result = await createWorkplace({
        name: values.name,
        description: values.description || undefined,
        defaultCurrencyCode: values.defaultCurrencyCode,
      });

      if (result.success) {
        form.reset();
        onOpenChange(false);
        
        // Find the newly created workplace (should be the last one in the list)
        const newWorkplace = state.workplaces[state.workplaces.length - 1];
        
        if (newWorkplace) {
          // Select the new workplace
          selectWorkplace(newWorkplace);
          
          // Navigate to the dashboard of the new workplace
          navigate(`/workplaces/${newWorkplace.workplaceID}/dashboard`);
          
          toast({
            title: "Success",
            description: `Workplace "${values.name}" has been created.`,
            variant: "default",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Workplace</DialogTitle>
          <DialogDescription>
            Fill out the details to create your new workplace.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter workplace name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter workplace description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="defaultCurrencyCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Currency</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={currencyState.isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={currencyState.isLoading ? "Loading currencies..." : "Select default currency"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px]">
                      {currencyState.isLoading ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
                        </div>
                      ) : currencyState.currencies && currencyState.currencies.length > 0 ? (
                        currencyState.currencies.map(currency => (
                          <SelectItem key={currency.currencyCode} value={currency.currencyCode}>
                            {currency.symbol} - {currency.name} ({currency.currencyCode})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="USD">$ - US Dollar (USD)</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {currencyState.error && (
                    <p className="text-xs text-red-500 mt-1">
                      Error loading currencies: {currencyState.error}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || currencyState.isLoading}>
                {isSubmitting ? "Creating..." : "Create Workplace"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWorkplaceDialog;
