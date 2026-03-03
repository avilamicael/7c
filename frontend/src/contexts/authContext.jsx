import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usuariosApi } from "@/lib/usuarios.api";
import { empresasApi } from "@/lib/empresas.api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const carregar = useCallback(async () => {
    try {
      const [u, e] = await Promise.all([
        usuariosApi.meuPerfil(),
        empresasApi.buscar(),
      ]);
      setUsuario(u);
      setEmpresa(e);
    } catch {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      navigate("/login", { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <AuthContext.Provider value={{ usuario, empresa, loading, recarregar: carregar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}