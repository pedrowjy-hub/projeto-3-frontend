import { Routes,Route } from "react-router";
import Login from "./pages/Login";
import PainelAdmin from "./pages/Admin";
import TelaPrincipal from "./pages/Tela_Principal";
import Inicio from "./pages/Inicio";

function App() {
  return (
    <Routes>
      <Route path="/" element={<TelaPrincipal />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<PainelAdmin />} />
      <Route path="/inicio" element={<Inicio />} />
    </Routes>
  );
}

export default App;
