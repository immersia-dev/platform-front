import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Gallery from "./pages/Gallery";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/gallery" element={<Gallery />} />
    </Routes>
  );
}
