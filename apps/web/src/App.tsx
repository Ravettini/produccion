import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import EventList from "./pages/EventList";
import EventForm from "./pages/EventForm";
import EventDetail from "./pages/EventDetail";
import ProposalDetail from "./pages/ProposalDetail";
import Admin from "./pages/Admin";
import Calendar from "./pages/Calendar";
import { AppShell } from "./components/layout/AppShell";
import { canCreateEvent } from "./hooks/usePermissions";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-600">Cargando…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireCreateEvent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!canCreateEvent(user)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<EventList />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="admin" element={<Admin />} />
        <Route
          path="events/new"
          element={
            <RequireCreateEvent>
              <EventForm />
            </RequireCreateEvent>
          }
        />
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="events/:id/edit" element={<EventForm />} />
        <Route path="proposals/:id" element={<ProposalDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
