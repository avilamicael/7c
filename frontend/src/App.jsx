import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RouteProgressBar } from "@/components/route-progress-bar";
import PrivateRoute from "@/components/private-route";
import { AuthProvider } from "@/contexts/authContext";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Clientes from "@/pages/clientes";
import Profile from "@/pages/profile";
import Financeiro from "@/pages/financeiro";
import { Toaster } from "sonner";

function PrivateApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/clientes" element={<PrivateRoute><Clientes /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/financeiro" element={<PrivateRoute><Financeiro /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="bottom-right" />
      <RouteProgressBar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<PrivateApp />} />
      </Routes>
    </BrowserRouter>
  );
}