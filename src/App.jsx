// src/App.jsx

import AppRoutes from "./routes/AppRoutes";
import { StaffAuthProvider } from "./context/StaffAuthContext";
import { WishlistProvider } from "./context/WishlistContext";
import { CatalogProvider } from "./context/CatalogContext";

const App = () => {
  return (
    <StaffAuthProvider>
      <CatalogProvider>
        <WishlistProvider>
          <AppRoutes />
        </WishlistProvider>
      </CatalogProvider>
    </StaffAuthProvider>
  );
};

export default App;
