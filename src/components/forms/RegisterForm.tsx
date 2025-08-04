import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { AlertAIError } from "../AlertAIError";

const registerSchema = z.object({
  email: z.string().email("Nieprawidłowy adres e-mail.").max(255),
  password: z
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .regex(/(?=.*[A-Za-z])(?=.*\d)/, "Hasło musi zawierać co najmniej jedną literę i cyfrę"),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Musisz zaakceptować regulamin",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła nie są takie same",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    // TODO: Implementacja logiki rejestracji
    console.log(data);
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

      <div>
        <Input
          type="password"
          placeholder="Hasło"
          {...register("password")}
          className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/50"
        />
        {errors.password && (
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
        {errors.confirmPassword && (
          <AlertAIError className="mt-2" message={errors.confirmPassword.message} />
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register("acceptTerms")}
          className="w-4 h-4 rounded bg-white/5 border-white/10"
        />
        <label className="text-sm text-white/90">
          Akceptuję regulamin i politykę prywatności
        </label>
      </div>
      {errors.acceptTerms && (
        <AlertAIError message={errors.acceptTerms.message} />
      )}

      <div className="flex flex-col gap-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          {isSubmitting ? "Rejestracja..." : "Zarejestruj się"}
        </Button>
        
        <div className="text-center text-sm">
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