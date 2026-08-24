// src/App.jsx

import AppRoutes from "./routes/AppRoutes";
import { StaffAuthProvider } from "./context/StaffAuthContext";

const App = () => {
  return (
    <StaffAuthProvider>
      <AppRoutes />
    </StaffAuthProvider>
  );
};

export default App;
