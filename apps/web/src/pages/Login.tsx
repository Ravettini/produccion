import { useState } from "react";
import { Building2 } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login } from "../api/auth";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardBody } from "../components/ui/Card";

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@gobierno.gob", password: "admin123" },
  { role: "Organización", email: "organizacion@gobierno.gob", password: "admin123" },
  { role: "Producción", email: "produccion@gobierno.gob", password: "admin123" },
  { role: "Institucionales", email: "institucionales@gobierno.gob", password: "admin123" },
  { role: "Cobertura", email: "cobertura@gobierno.gob", password: "admin123" },
  { role: "Validador", email: "validador@gobierno.gob", password: "admin123" },
] as const;

const DEMO_AREA_HINT =
  "Usuarios por DG (cultura.ciudadana@…, bienestar.ciudadano@…, etc.): contraseña usuario123";

export default function Login() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user: u } = await login(email, password);
      setUser(u);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const fillAccount = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-sidebar via-slate-900 to-brand-900 p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-brand-500 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-cyan-500 blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Eventos Institucionales</p>
              <p className="text-slate-400 text-sm">Gestión y requerimientos</p>
            </div>
          </div>
        </div>
        <div className="relative space-y-4">
          <h2 className="text-3xl font-bold text-white leading-tight">
            Plataforma de gestión de eventos y briefs institucionales
          </h2>
          <p className="text-slate-300 text-lg max-w-md">
            Centralizá requerimientos, validaciones y generación de briefs con trazabilidad completa.
          </p>
        </div>
        <p className="relative text-slate-500 text-sm flex items-center gap-2">
          <Building2 className="w-4 h-4" aria-hidden />
          Sistema interno de gestión gubernamental
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center bg-surface px-4 py-8 sm:px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold">E</span>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Eventos Institucionales</p>
              <p className="text-slate-500 text-sm">Gestión y requerimientos</p>
            </div>
          </div>

          <Card className="shadow-cardHover border-slate-200/80">
            <CardBody className="p-6 sm:p-8">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Iniciar sesión</h1>
                <p className="text-slate-500 text-sm mt-1">
                  Ingresá con tu cuenta institucional
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="usuario@gobierno.gob"
                  autoComplete="email"
                />
                <Input
                  label="Contraseña"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm" role="alert">
                    {error}
                  </div>
                )}
                <Button type="submit" disabled={loading} size="lg" className="w-full">
                  {loading ? "Ingresando…" : "Ingresar"}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-3">
                  Credenciales demo — clic para completar
                </p>
                <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {DEMO_ACCOUNTS.map((account) => (
                    <li key={account.email}>
                      <button
                        type="button"
                        onClick={() => fillAccount(account)}
                        className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
                      >
                        <span className="font-medium text-slate-800">{account.role}</span>
                        <span className="block text-slate-500 text-xs mt-0.5 truncate">
                          {account.email} / {account.password}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">{DEMO_AREA_HINT}</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
