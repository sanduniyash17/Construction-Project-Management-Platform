import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Projects from "../pages/Projects";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">
        {title}
      </h1>

      <p className="mt-2 text-sm text-slate-500">
        This module will be built in a later phase.
      </p>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/dashboard" element={<Dashboard />} />

      <Route path="/projects" element={<Projects />} />

      <Route
        path="/tasks"
        element={<PlaceholderPage title="Tasks" />}
      />

      <Route
        path="/team"
        element={<PlaceholderPage title="Team" />}
      />

      <Route
        path="/materials"
        element={<PlaceholderPage title="Materials" />}
      />

      <Route
        path="/expenses"
        element={<PlaceholderPage title="Expenses" />}
      />

      <Route
        path="/documents"
        element={<PlaceholderPage title="Documents" />}
      />

      <Route
        path="/reports"
        element={<PlaceholderPage title="Reports" />}
      />

      <Route
        path="/settings"
        element={<PlaceholderPage title="Settings" />}
      />
    </Routes>
  );
}

export default AppRoutes;