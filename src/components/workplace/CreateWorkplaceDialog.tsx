
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/services/apiService";
import { useWorkplace } from "@/context/WorkplaceContext";
import { Workplace } from "@/lib/types";

const workplaceSchema = z.object({
  name: z.string().min(1, "Workplace name is required"),
  description: z.string().optional(),
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
  const { fetchWorkplaces } = useWorkplace();
  
  const form = useForm<WorkplaceFormValues>({
    resolver: zodResolver(workplaceSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: WorkplaceFormValues) => {
    try {
      const response = await apiService.createWorkplace({
        name: values.name,
        description: values.description || undefined,
      });

      if (response.error) {
        toast({
          title: "Error creating workplace",
          description: response.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Workplace created successfully",
        });
        form.reset();
        onOpenChange(false);
        // Refresh the list of workplaces
        fetchWorkplaces();
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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
