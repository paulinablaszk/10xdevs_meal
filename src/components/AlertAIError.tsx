import { Alert } from './ui/alert';
import { cn } from '../lib/utils';

interface AlertAIErrorProps {
  message: string;
  className?: string;
  title?: string;
}

export function AlertAIError({ message, className, title = "Błąd" }: AlertAIErrorProps) {
  return (
    <Alert variant="destructive" className={cn("bg-red-50 border-red-200 text-red-700", className)}>
      <div className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm">{message}</p>
        </div>
      </div>
    </Alert>
  );
} 