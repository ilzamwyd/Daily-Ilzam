"use client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function PrintReportButton() {
  return (
    <Button type="button" variant="soft" size="sm" className="gap-2 print:hidden" onClick={() => window.print()}>
      <Download className="h-4 w-4" /> Download PDF
    </Button>
  );
}
