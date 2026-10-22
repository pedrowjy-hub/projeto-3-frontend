import { Routes,Route } from "react-router";
import Login from "./pages/Login";
import TelaPrincipal from "./pages/Tela_Principal";

function App() {
  return (
    <Routes>
      <Route path="/" element={<TelaPrincipal />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;
