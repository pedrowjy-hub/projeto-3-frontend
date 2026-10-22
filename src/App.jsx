import { Routes,Route } from "react-router";
import Login from "./pages/Login";
import PainelAdmin from "./pages/Admin";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<PainelAdmin />} />
    </Routes>
  );
}

export default App;