import { BrowserRouter } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <BrowserRouter>
      <Sidebar />
      <Header />

      <main className="min-h-screen bg-slate-100 pt-16 pl-64">
        <div className="p-8">
          <AppRoutes />
        </div>
      </main>
    </BrowserRouter>
  );
}

export default App;