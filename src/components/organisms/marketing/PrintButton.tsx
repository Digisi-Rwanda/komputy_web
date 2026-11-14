"use client";
import { Download } from "lucide-react";
import { Button } from "@/components/atoms/Button";

/** "Download PDF" via the browser's print-to-PDF (print styles hide navigation). */
export const PrintButton = () => <Button variant="secondary" icon={<Download />} className="w-fit print:hidden" onClick={() => window.print()}>Download PDF</Button>;
