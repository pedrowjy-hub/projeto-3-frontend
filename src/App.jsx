import { Routes,Route } from "react-router";
import Login from "./pages/Login";
import PainelAdmin from "./pages/Admin";
import TelaPrincipal from "./pages/Tela_Principal";
import Cadastro from "./pages/Cadastro";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<TelaPrincipal />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/admin" element={<PainelAdmin />} />
      <Route path="/inicio" element={<Dashboard />} />
      <Route path="/inicio/perfil" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/perfil" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
