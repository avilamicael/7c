import { BrowserRouter, Routes, Route } from "react-router-dom"
import { RouteProgressBar } from "@/components/route-progress-bar"
import Dashboard from "@/pages/dashboard"
import Configuracoes from "@/pages/configuracoes"

export default function App() {
  return (
    <BrowserRouter>
      <RouteProgressBar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Routes>
    </BrowserRouter>
  )
}