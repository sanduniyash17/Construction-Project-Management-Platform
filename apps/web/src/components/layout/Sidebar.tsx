import { NavLink } from "react-router-dom";

const navigation = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Projects", path: "/projects" },
  { name: "Tasks", path: "/tasks" },
  { name: "Team", path: "/team" },
  { name: "Materials", path: "/materials" },
  { name: "Expenses", path: "/expenses" },
  { name: "Documents", path: "/documents" },
  { name: "Reports", path: "/reports" },
];

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-64 border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">BuildFlow</h1>
          <p className="text-xs text-slate-500">Construction Management</p>
        </div>
      </div>

      <nav className="space-y-1 p-4">
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block rounded-lg px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-0 w-full border-t border-slate-200 p-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `block rounded-lg px-4 py-3 text-sm font-medium ${
              isActive
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`
          }
        >
          Settings
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;