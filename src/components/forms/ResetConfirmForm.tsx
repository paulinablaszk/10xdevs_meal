import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { AlertAIError } from "../AlertAIError";

const resetConfirmSchema = z
  .object({
    password: z
      .string()
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(/(?=.*[A-Za-z])(?=.*\d)/, "Hasło musi zawierać co najmniej jedną literę i cyfrę"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są takie same",
    path: ["confirmPassword"],
  });

type ResetConfirmFormData = z.infer<typeof resetConfirmSchema>;

export function ResetConfirmForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetConfirmFormData>({
    resolver: zodResolver(resetConfirmSchema),
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onSubmit = async (data: ResetConfirmFormData) => {
    // TODO: Implementacja logiki zmiany hasła
    // data jest obecnie nieużywana, ale będzie potrzebna po implementacji logiki
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm mx-auto">
      <div>
        <Input
          type="password"
          placeholder="Nowe hasło"
          {...register("password")}
          className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/50"
        />
        {errors.password && <AlertAIError className="mt-2" message={errors.password.message} />}
      </div>

      <div>
        <Input
          type="password"
          placeholder="Potwierdź nowe hasło"
          {...register("confirmPassword")}
          className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/50"
        />
        {errors.confirmPassword && (
          <AlertAIError className="mt-2" message={errors.confirmPassword.message} />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          {isSubmitting ? "Zapisywanie..." : "Ustaw nowe hasło"}
        </Button>

        <div className="text-center text-sm">
          <a href="/auth/login" className="text-blue-200 hover:text-blue-100">
            Powrót do logowania
          </a>
        </div>
      </div>
    </form>
  );
}
