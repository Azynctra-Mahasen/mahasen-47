
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const productSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be positive"),
  discounts: z.number().min(0).nullable(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  discounts?: number | null;
}

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  product?: Product | null;
}

export function ProductDialog({ open, onOpenChange, onSuccess, product }: ProductDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditing = !!product;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      discounts: null,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        title: product.title,
        description: product.description,
        price: product.price,
        discounts: product.discounts || null,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        price: 0,
        discounts: null,
      });
    }
  }, [product, form]);

  const generateEmbedding = async (text: string) => {
    console.log('Generating embedding for:', text);
    toast({
      title: "Processing",
      description: "Generating embedding...",
    });

    const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke(
      'generate-file-embedding',
      {
        body: { text }
      }
    );

    if (embeddingError) throw embeddingError;
    console.log('Embedding generated successfully');
    return embeddingData.embedding;
  };

  const removeExistingEmbedding = async (productId: string) => {
    console.log('Removing existing embedding for product:', productId);
    toast({
      title: "Processing",
      description: "Removing existing embedding...",
    });

    const { error } = await supabase
      .from('products')
      .update({
        embedding: null,
        embedding_status: 'pending'
      })
      .eq('id', productId);

    if (error) throw error;
    console.log('Existing embedding removed successfully');
  };

  const onSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      const textToEmbed = `${values.title} ${values.description}`;

      if (isEditing && product) {
        // First remove existing embedding
        await removeExistingEmbedding(product.id);
        
        // Generate new embedding
        const embedding = await generateEmbedding(textToEmbed);
        toast({
          title: "Processing",
          description: "Updating product with new embedding...",
        });

        // Update product with new data and embedding
        const { error: updateError } = await supabase
          .from('products')
          .update({
            title: values.title,
            description: values.description,
            price: values.price,
            discounts: values.discounts,
            embedding,
            embedding_status: 'completed'
          })
          .eq('id', product.id);

        if (updateError) throw updateError;

        toast({
          title: "Success",
          description: "Product updated successfully with new embedding",
        });
      } else {
        // For new products, generate embedding and insert
        const embedding = await generateEmbedding(textToEmbed);
        toast({
          title: "Processing",
          description: "Creating new product with embedding...",
        });

        const { error: insertError } = await supabase
          .from('products')
          .insert({
            title: values.title,
            description: values.description,
            price: values.price,
            discounts: values.discounts,
            embedding,
            embedding_status: 'completed'
          });

        if (insertError) throw insertError;

        toast({
          title: "Success",
          description: "Product created successfully with embedding",
        });
      }

      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} product. Please try again.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Product title" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Product description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="price"
              render={({ field: { onChange, ...field }}) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      onChange={e => onChange(parseFloat(e.target.value))}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="discounts"
              render={({ field: { onChange, value, ...field }}) => (
                <FormItem>
                  <FormLabel>Discounts (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      onChange={e => onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      value={value || ""}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {isEditing ? "Discard" : "Cancel"}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 
                  (isEditing ? "Updating..." : "Creating...") : 
                  (isEditing ? "Save" : "Create Product")
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
