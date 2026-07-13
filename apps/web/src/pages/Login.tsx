import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Building2, Lock, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { login } from "../api/auth";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardBody } from "../components/ui/Card";

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

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-red-700 p-12 flex-col justify-between overflow-hidden">
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
              <p className="text-slate-400 text-sm">Gestión y propuestas</p>
            </div>
          </div>
        </div>
        <div className="relative space-y-4">
          <h2 className="text-3xl font-bold text-white leading-tight">
            Plataforma de gestión de eventos y briefs institucionales
          </h2>
          <p className="text-slate-300 text-lg max-w-md">
            Centralizá propuestas, validaciones y generación de briefs con trazabilidad completa.
          </p>
        </div>
        <p className="relative text-slate-500 text-sm flex items-center gap-2">
          <Building2 className="w-4 h-4" aria-hidden />
          Sistema interno de gestión gubernamental
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center bg-red-600 px-4 py-8 sm:px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold">E</span>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Eventos Institucionales</p>
              <p className="text-slate-500 text-sm">Gestión y propuestas</p>
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

              <div className="mt-6 pt-6 border-t border-slate-100 rounded-xl bg-slate-50/80 p-4">
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-2">
                  Credenciales demo
                </p>
                <div className="space-y-1.5 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" aria-hidden />
                    admin@gobierno.gob / admin123
                  </p>
                  <p className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-slate-400" aria-hidden />
                    organizacion@gobierno.gob / admin123
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
