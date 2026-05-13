import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ExportButtonProps {
  type: "pdf" | "csv";
  reportType: "artifact" | "ledger" | "analytics";
  data: any;
  artifactId?: string;
  label?: string;
  className?: string;
}

export function ExportButton({ type, reportType, data, artifactId, label, className }: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const exportArtifactPDF = trpc.export.exportArtifactPDF.useMutation();
  const exportArtifactsCSV = trpc.export.exportArtifactsCSV.useMutation();
  const exportLedgerCSV = trpc.export.exportLedgerCSV.useMutation();
  const exportAnalyticsCSV = trpc.export.exportAnalyticsCSV.useMutation();
  const exportAnalyticsPDF = trpc.export.exportAnalyticsPDF.useMutation();

  const handleExport = async () => {
    setIsLoading(true);
    setIsSuccess(false);

    try {
      let result;

      if (type === "pdf" && reportType === "artifact") {
        result = await exportArtifactPDF.mutateAsync({
          artifactId: artifactId || "unknown",
          artifactData: data,
        });
      } else if (type === "csv" && reportType === "artifact") {
        result = await exportArtifactsCSV.mutateAsync({
          artifacts: Array.isArray(data) ? data : [data],
        });
      } else if (type === "csv" && reportType === "ledger") {
        result = await exportLedgerCSV.mutateAsync({
          ledgerEntries: Array.isArray(data) ? data : [data],
        });
      } else if (type === "csv" && reportType === "analytics") {
        result = await exportAnalyticsCSV.mutateAsync({
          analyticsData: data,
        });
      } else if (type === "pdf" && reportType === "analytics") {
        result = await exportAnalyticsPDF.mutateAsync({
          analyticsData: data,
        });
      }

      if (result) {
        // Download the file
        const binaryString = atob(result.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: result.contentType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);

        setIsSuccess(true);
        toast.success(`${type.toUpperCase()} exported successfully`);

        // Reset success state after 2 seconds
        setTimeout(() => setIsSuccess(false), 2000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Export failed";
      toast.error(errorMessage);
      console.error("Export error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonLabel = label || `Export as ${type.toUpperCase()}`;

  return (
    <Button
      onClick={handleExport}
      disabled={isLoading}
      variant={isSuccess ? "default" : "outline"}
      className={className}
      title={`Export ${reportType} as ${type.toUpperCase()}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : isSuccess ? (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          Exported!
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          {buttonLabel}
        </>
      )}
    </Button>
  );
}

interface ExportMenuProps {
  reportType: "artifact" | "ledger" | "analytics";
  data: any;
  artifactId?: string;
}

export function ExportMenu({ reportType, data, artifactId }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const supportedFormats = {
    artifact: ["pdf", "csv"],
    ledger: ["csv"],
    analytics: ["pdf", "csv"],
  };

  const formats = supportedFormats[reportType] as Array<"pdf" | "csv">;

  return (
    <div className="relative inline-block">
      <Button variant="outline" onClick={() => setIsOpen(!isOpen)} className="gap-2">
        <Download className="h-4 w-4" />
        Export
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-2">
            {formats.includes("pdf") && (
              <ExportButton
                type="pdf"
                reportType={reportType}
                data={data}
                artifactId={artifactId}
                label="Export as PDF"
                className="w-full justify-start"
              />
            )}
            {formats.includes("csv") && (
              <ExportButton
                type="csv"
                reportType={reportType}
                data={data}
                artifactId={artifactId}
                label="Export as CSV"
                className="w-full justify-start mt-2"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
