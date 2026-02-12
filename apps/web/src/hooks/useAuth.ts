import { useNavigate } from "react-router-dom";
import { useAuth as useAuthContext } from "../context/AuthContext";
import { logout } from "../api/auth";

export function useAuth() {
  const { user, loading, setUser } = useAuthContext();
  const navigate = useNavigate();

  const isAdmin = user?.role === "ADMIN";

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate("/login");
  };

  return { user, loading, setUser, isAdmin, logout: handleLogout };
}
