import { Routes,Route } from "react-router";
import Login from "./pages/Login";
import PainelAdmin from "./pages/Admin";
import TelaPrincipal from "./pages/Tela_Principal";

function App() {
  return (
    <Routes>
      <Route path="/" element={<TelaPrincipal />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<PainelAdmin />} />
    </Routes>
  );
}

export default App;
