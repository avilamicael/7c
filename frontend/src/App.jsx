import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { RouteProgressBar } from "@/components/route-progress-bar"
import PrivateRoute from "@/components/private-route"
import Login from "@/pages/login"
import Dashboard from "@/pages/dashboard"
import Clientes from "@/pages/clientes"
import Profile from "@/pages/profile"
import { Toaster } from "sonner";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="bottom-right" />
      <RouteProgressBar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/clientes" element={<PrivateRoute><Clientes /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}