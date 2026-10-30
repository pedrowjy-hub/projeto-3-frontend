import { Routes,Route } from "react-router";
import Login from "./pages/Login";
import PainelAdmin from "./pages/Admin";
import TelaPrincipal from "./pages/Tela_Principal";
import Cadastro from "./pages/Cadastro";
import Dashboard from "./pages/Dashboard";
import Configuracoes from "./pages/Configuracoes";
import Explorar from "./pages/Explorar";
import Postagens from "./pages/Postagens";
import Planos from "./pages/Planos";
import RecursosPremium from "./pages/RecursosPremium";

function App() {
  return (
    <Routes>
      <Route path="/" element={<TelaPrincipal />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/admin" element={<PainelAdmin />} />
      <Route path="/inicio" element={<Dashboard />} />
      <Route path="/perfil" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/configuracoes" element={<Configuracoes />} />
      <Route path="/explorar" element={<Explorar />} />
      <Route path="/postagens" element={<Postagens />} />
      <Route path="/planos" element={<Planos />} />
      <Route path="/assinatura" element={<Planos />} />
      <Route path="/mensagens" element={<RecursosPremium recurso="mensagens" />} />
      <Route path="/contratos" element={<RecursosPremium recurso="contratos" />} />
    </Routes>
  );
}

export default App;
