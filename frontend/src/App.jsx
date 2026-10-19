
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import MarketplacePage from "./pages/MarketplacePage";
import ListingDetailsPage from "./pages/ListingDetailsPage";
import CreateListingPage from "./pages/CreateListingPage";
import WantedItemsPage from "./pages/WantedItemsPage";
import CreateWantedItemPage from "./pages/CreateWantedItemPage";
import MyWantedItemsPage from "./pages/MyWantedItemsPage";
import MyListingsPage from "./pages/MyListingsPage";
import WishlistPage from "./pages/WishlistPage";
import CartPage from "./pages/CartPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import SellerOrdersPage from "./pages/SellerOrdersPage";
import NotFoundPage from "./pages/NotFoundPage";
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={<ProfilePage />} />

      <Route path="/marketplace" element={<MarketplacePage />} />
      <Route path="/listings/:id" element={<ListingDetailsPage />} />
      <Route path="/listings/create" element={<CreateListingPage />} />
      <Route path="/my-listings" element={<MyListingsPage />} />

      <Route path="/wanted-items" element={<WantedItemsPage />} />
      <Route
        path="/wanted-items/create"
        element={<CreateWantedItemPage />}
      />
      <Route
        path="/my-wanted-items"
        element={<MyWantedItemsPage />}
      />

      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/my-orders" element={<MyOrdersPage />} />
      <Route path="/seller-orders" element={<SellerOrdersPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
