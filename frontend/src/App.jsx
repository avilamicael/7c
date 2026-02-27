import { BrowserRouter, Routes, Route } from "react-router-dom"
import { RouteProgressBar } from "@/components/route-progress-bar"
import Dashboard from "@/pages/dashboard"
import Configuracoes from "@/pages/configuracoes"
import Clientes from "@/pages/clientes"                                 // ← adicionar

export default function App() {
  return (
    <BrowserRouter>
      <RouteProgressBar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="/clientes" element={<Clientes />} />               {/* ← adicionar */}
      </Routes>
    </BrowserRouter>
  )
}