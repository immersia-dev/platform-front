import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Gallery from "./pages/Gallery";
import InstructorDashboard from "./pages/InstructorDashboard";
import StudentDetail from "./pages/StudentDetail";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/instructor" element={<InstructorDashboard />} />
      <Route path="/instructor/student/:studentId" element={<StudentDetail />} />
    </Routes>
  );
}
