import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

export interface AlertAIErrorProps {
  description: string;
  onRetry?: () => void;
}

export const AlertAIError = ({ description, onRetry }: AlertAIErrorProps) => {
  return (
    <Alert variant="destructive" className="flex flex-col gap-4">
      <div className="flex gap-2">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertDescription>{description}</AlertDescription>
      </div>
      
      {onRetry && (
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="bg-white hover:bg-white/90"
          >
            Spróbuj ponownie
          </Button>
        </div>
      )}
    </Alert>
  );
}; 