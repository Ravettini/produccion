import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-6 sm:py-8">
      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="text-xl font-semibold text-slate-800 text-center mb-1">
            Gestión de Eventos
          </h1>
          <p className="text-center text-slate-600 text-sm mb-6">
            Brief y propuestas institucionales
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <p className="text-red-600 text-sm" role="alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-slate-500 text-xs font-medium mb-1">Credenciales demo</p>
            <p className="text-slate-600 text-sm">Admin: admin@gobierno.gob / admin123</p>
            <p className="text-slate-600 text-sm">Usuario: organizacion@gobierno.gob / admin123</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
