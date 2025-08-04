import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { AlertAIError } from "../AlertAIError";
import { useState } from "react";

const registerSchema = z.object({
  email: z.string().email("Nieprawidłowy adres e-mail.").max(255),
  password: z.string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .regex(/(?=.*[A-Za-z])(?=.*\d)/, "Hasło musi zawierać co najmniej jedną literę i cyfrę"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła nie są takie same",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.status === 'error') {
        setIsSuccess(false);
        setError('root', { 
          message: result.message || 'Wystąpił błąd podczas rejestracji.' 
        });
        return;
      }

      // Wyświetl komunikat o sukcesie i przekieruj
      setIsSuccess(true);
      setError('root', { 
        message: result.message || 'Rejestracja zakończona sukcesem. Przekierowuję...' 
      });

      // Przekieruj na stronę główną po udanej rejestracji
      setTimeout(() => {
        window.location.href = '/recipes';
      }, 1500);

    } catch (error) {
      console.error('Błąd rejestracji:', error);
      setIsSuccess(false);
      setError('root', { 
        message: 'Wystąpił nieoczekiwany błąd podczas rejestracji.' 
      });
    }
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
        {errors.email && errors.email.message && (
          <AlertAIError className="mt-2" message={errors.email.message} />
        )}
      </div>

      <div>
        <Input
          type="password"
          placeholder="Hasło"
          {...register("password")}
          className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/50"
        />
        {errors.password && errors.password.message && (
          <AlertAIError className="mt-2" message={errors.password.message} />
        )}
      </div>

      <div>
        <Input
          type="password"
          placeholder="Potwierdź hasło"
          {...register("confirmPassword")}
          className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/50"
        />
        {errors.confirmPassword && errors.confirmPassword.message && (
          <AlertAIError className="mt-2" message={errors.confirmPassword.message} />
        )}
      </div>

      {errors.root && errors.root.message && (
        <AlertAIError 
          message={errors.root.message} 
          title={isSuccess ? 'Sukces!' : 'Błąd'} 
        />
      )}

      <div className="flex flex-col gap-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          {isSubmitting ? "Rejestracja..." : "Zarejestruj się"}
        </Button>
        
        <div className="flex justify-center text-sm">
          <a
            href="/auth/login"
            className="text-blue-200 hover:text-blue-100"
          >
            Masz już konto? Zaloguj się
          </a>
        </div>
      </div>
    </form>
  );
} 