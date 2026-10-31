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
import Mensagens from "./pages/Mensagens";
import Contratos from "./pages/Contratos";
import Denuncias from "./pages/Denuncias";
import Analises from "./pages/Analises";

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
      <Route path="/mensagens" element={<Mensagens />} />
      <Route path="/contratos" element={<Contratos />} />
      <Route path="/denuncias" element={<Denuncias />} />
      <Route path="/analises" element={<Analises />} />
    </Routes>
  );
}

export default App;
