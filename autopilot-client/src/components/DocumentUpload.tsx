import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { brandProfilesApi } from "@/lib/api";
import { useTenant } from "@/hooks/useTenant";

interface DocumentUploadProps {
  onResult: (data: Record<string, string>) => void;
}

export function DocumentUpload({ onResult }: DocumentUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { tenant } = useTenant();
  const { toast } = useToast();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  }

  async function handleSubmit() {
    if (!selectedFile || !tenant?.id) return;

    setUploading(true);
    try {
      const data = await brandProfilesApi.parseDocument(selectedFile, tenant.id);
      onResult(data);
      toast({ title: "Document parsed", description: "Review the extracted fields and save." });
    } catch (e: unknown) {
      toast({
        title: "Parse failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2 space-x-2">
      <Input type="file" ref={fileRef} onChange={handleChange} accept=".pdf,.docx,.txt" />
      <Button onClick={() => fileRef.current?.click()} type="button" variant="outline">
        Choose File
      </Button>
      <Button onClick={handleSubmit} disabled={!selectedFile || !tenant || uploading}>
        {uploading ? "Parsing…" : "Parse document"}
      </Button>
    </div>
  );
}
