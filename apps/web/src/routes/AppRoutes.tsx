import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Projects from "../pages/Projects";
import Tasks from "../pages/Tasks";
import Team from "../pages/Team";
import Materials from "../pages/Materials";
import Expenses from "../pages/Expenses";
import Documents from "../pages/Documents";
import Reports from "../pages/Reports";
import Settings from "../pages/Settings";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/dashboard" element={<Dashboard />} />

      <Route path="/projects" element={<Projects />} />

      <Route path="/tasks" element={<Tasks />} />

      <Route path="/team" element={<Team />} />

      <Route path="/materials" element={<Materials />} />

      <Route path="/expenses" element={<Expenses />} />

      <Route path="/documents" element={<Documents />} />

      <Route path="/reports" element={<Reports />} />

      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

export default AppRoutes;