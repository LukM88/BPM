import { useState, useEffect } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsAuthenticated(true);
  }, []);

  return isAuthenticated ? (
    <Dashboard />
  ) : (
    <Login onLogin={() => setIsAuthenticated(true)} />
  );
}

export default App;
