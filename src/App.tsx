import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";

function GalleryPlaceholder() {
  return null; // placeholder proposital: vamos criar a tela depois
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/gallery" element={<GalleryPlaceholder />} />
    </Routes>
  );
}
