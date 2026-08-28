import AppRoutes from "./routes/AppRoutes";
import { StaffAuthProvider } from "./context/StaffAuthContext";
import { WishlistProvider } from "./context/WishlistContext";
import { CatalogProvider } from "./context/CatalogContext";
import { CustomerAuthProvider } from "./context/CustomerAuthContext";
import { CartProvider } from "./context/CartContext";

const App = () => {
  return (
    <StaffAuthProvider>
      <CatalogProvider>
        <CustomerAuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AppRoutes />
            </WishlistProvider>
          </CartProvider>
        </CustomerAuthProvider>
      </CatalogProvider>
    </StaffAuthProvider>
  );
};

export default App;
