
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { FileUploader } from "@/components/knowledge-base/FileUploader";
import { FileList } from "@/components/knowledge-base/FileList";
import { ProductsSection } from "@/components/knowledge-base/ProductsSection";
import { useQueryClient } from "@tanstack/react-query";

const KnowledgeBase = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["knowledge-base-files"] });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            className="mr-4"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
        </div>

        <FileUploader onUploadSuccess={handleUploadSuccess} />

        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Your Files</h2>
          <FileList />
        </div>

        <ProductsSection />
      </div>
    </div>
  );
};

export default KnowledgeBase;
