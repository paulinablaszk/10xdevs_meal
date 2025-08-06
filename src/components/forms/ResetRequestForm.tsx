import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { AlertAIError } from "../AlertAIError";

const resetRequestSchema = z.object({
  email: z.string().email("Nieprawidłowy adres e-mail.").max(255),
});

type ResetRequestFormData = z.infer<typeof resetRequestSchema>;

export function ResetRequestForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetRequestFormData>({
    resolver: zodResolver(resetRequestSchema),
  });

  const onSubmit = async (data: ResetRequestFormData) => {
    // TODO: Implementacja logiki wysyłania linku resetującego
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm mx-auto">
      <div>
        <Input
          type="email"
          placeholder="E-mail"
          {...register("email")}
          className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/50"
        />
        {errors.email && (
          <AlertAIError className="mt-2" message={errors.email.message} />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          {isSubmitting ? "Wysyłanie..." : "Wyślij link resetujący"}
        </Button>
        
        <div className="text-center text-sm">
          <a
            href="/auth/login"
            className="text-blue-200 hover:text-blue-100"
          >
            Powrót do logowania
          </a>
        </div>
      </div>
    </form>
  );
} 