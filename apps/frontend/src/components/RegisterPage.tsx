import { useState } from "react";
import {
  Shield,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";

interface RegisterPageProps {
  onRegisterSuccess: () => void;
  onBackToLogin: () => void;
}

export function RegisterPage({
  onRegisterSuccess,
  onBackToLogin,
}: RegisterPageProps) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Password validation rules
  const passwordRules = {
    minLength: formData.password.length >= 8,
    hasUppercase: /[A-Z]/.test(formData.password),
    hasLowercase: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecial: /[@$!%*?&]/.test(formData.password),
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validation
    if (!formData.email.trim()) {
      newErrors.email = "L'email è obbligatoria";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Formato email non valido";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Lo username è obbligatorio";
    } else if (formData.username.length < 3) {
      newErrors.username = "Lo username deve avere almeno 3 caratteri";
    }

    if (!formData.password) {
      newErrors.password = "La password è obbligatoria";
    } else if (!passwordRules.minLength) {
      newErrors.password = "La password deve avere almeno 8 caratteri";
    } else if (!passwordRules.hasUppercase) {
      newErrors.password = "La password deve contenere almeno una lettera maiuscola";
    } else if (!passwordRules.hasLowercase) {
      newErrors.password = "La password deve contenere almeno una lettera minuscola";
    } else if (!passwordRules.hasNumber) {
      newErrors.password = "La password deve contenere almeno un numero";
    } else if (!passwordRules.hasSpecial) {
      newErrors.password = "La password deve contenere almeno un carattere speciale (@$!%*?&)";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Le password non coincidono";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.username, formData.email, formData.password);
      toast.success("Registrazione completata con successo!");
      onRegisterSuccess();
    } catch (err: any) {
      setIsLoading(false);
      const errorMessage = err.message || "Errore durante la registrazione. Riprova.";
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: "", general: "" });
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white border border-[#e5e5e5] rounded-xl mb-4 shadow-sm">
            <Shield className="w-8 h-8 text-[#2e3338]" />
          </div>
          <h1 className="text-[#2e3338] mb-2">Code Guardian</h1>
          <p className="text-[#73787e]">Crea il tuo account</p>
        </div>

        <div className="bg-white border border-[#e5e5e5] rounded-lg p-8 shadow-sm">
          <button
            onClick={onBackToLogin}
            disabled={isLoading}
            className="flex items-center gap-2 text-[#73787e] hover:text-[#2e3338] mb-6 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna al login
          </button>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-[#2e3338] mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => updateField("username", e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-white border border-[#e5e5e5] rounded-lg text-[#2e3338] placeholder:text-[#b4b4b4] focus:outline-none focus:ring-2 focus:ring-[#2e3338] transition-all disabled:opacity-50"
                placeholder="Scegli uno username"
              />
              {errors.username && (
                <p className="text-red-600 text-sm mt-1">{errors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-[#2e3338] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-white border border-[#e5e5e5] rounded-lg text-[#2e3338] placeholder:text-[#b4b4b4] focus:outline-none focus:ring-2 focus:ring-[#2e3338] transition-all disabled:opacity-50"
                placeholder="tuo@email.com"
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-[#2e3338] mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-white border border-[#e5e5e5] rounded-lg text-[#2e3338] placeholder:text-[#b4b4b4] focus:outline-none focus:ring-2 focus:ring-[#2e3338] transition-all disabled:opacity-50"
                placeholder="Crea una password sicura"
              />
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">{errors.password}</p>
              )}

              {formData.password && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    {passwordRules.minLength ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                    <span
                      className={
                        passwordRules.minLength
                          ? "text-green-600"
                          : "text-[#73787e]"
                      }
                    >
                      Almeno 8 caratteri
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {passwordRules.hasUppercase ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                    <span
                      className={
                        passwordRules.hasUppercase
                          ? "text-green-600"
                          : "text-[#73787e]"
                      }
                    >
                      Una lettera maiuscola
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {passwordRules.hasLowercase ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                    <span
                      className={
                        passwordRules.hasLowercase
                          ? "text-green-600"
                          : "text-[#73787e]"
                      }
                    >
                      Una lettera minuscola
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {passwordRules.hasNumber ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                    <span
                      className={
                        passwordRules.hasNumber
                          ? "text-green-600"
                          : "text-[#73787e]"
                      }
                    >
                      Un numero
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {passwordRules.hasSpecial ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                    <span
                      className={
                        passwordRules.hasSpecial
                          ? "text-green-600"
                          : "text-[#73787e]"
                      }
                    >
                      Un carattere speciale (@$!%*?&)
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-[#2e3338] mb-2"
              >
                Conferma Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-white border border-[#e5e5e5] rounded-lg text-[#2e3338] placeholder:text-[#b4b4b4] focus:outline-none focus:ring-2 focus:ring-[#2e3338] transition-all disabled:opacity-50"
                placeholder="Ripeti la password"
              />
              {errors.confirmPassword && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {errors.general && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <p className="text-red-600 text-sm">{errors.general}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-[#2e3338] text-white rounded-lg hover:bg-[#1a1d20] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registrazione in corso...
                </>
              ) : (
                "Registrati"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
