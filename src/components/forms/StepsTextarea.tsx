import { Textarea } from "@/components/ui/textarea";
import type { TextareaHTMLAttributes } from "react";

interface StepsTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function StepsTextarea(props: StepsTextareaProps) {
  return (
    <Textarea
      {...props}
      placeholder="Wpisz kroki przygotowania, każdy krok w nowej linii..."
      className="min-h-[200px] font-mono text-sm"
    />
  );
} 