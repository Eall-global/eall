// src/App.jsx

import AppRoutes from "./routes/AppRoutes";
import { StaffAuthProvider } from "./context/StaffAuthContext";
import { WishlistProvider } from "./context/WishlistContext";

const App = () => {
  return (
    <StaffAuthProvider>
      <WishlistProvider>
        <AppRoutes />
      </WishlistProvider>
    </StaffAuthProvider>
  );
};

export default App;
