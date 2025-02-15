
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const ProductsSection = () => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-6 mt-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Products / Services</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Product cards will go here */}
        <div className="text-center py-8 text-muted-foreground">
          No products added yet
        </div>
      </div>
    </div>
  );
};
