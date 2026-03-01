import { useState, useEffect, useCallback } from "react";
import { usuariosApi } from "@/lib/usuarios.api";
import { empresasApi } from "@/lib/empresas.api";

export function useAuth() {
  const [usuario, setUsuario] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const [u, e] = await Promise.all([
        usuariosApi.meuPerfil(),
        empresasApi.buscar(),
      ]);
      setUsuario(u);
      setEmpresa(e);
    } catch {
      // token expirado — PrivateRoute redireciona
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { usuario, empresa, loading, recarregar: carregar };
}