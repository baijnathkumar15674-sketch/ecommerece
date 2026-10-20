import { Heart, ShoppingCart, Sun, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import { useCartStore } from "../../store/cartStore";
import { useWishlistStore } from "../../store/wishlistStore";
import { useAuth } from "../../auth/auth";
import { useEffect, useState } from "react";

export default function Header() {
  const { customer, logout } = useAuth();
  const cartCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );
  const wishlistCount = useWishlistStore((state) => state.items.length);

 const [darkMode, setDarkMode] = useState(
  () => localStorage.getItem("shopora-theme") === "dark"
);

useEffect(() => {
  document.documentElement.dataset.theme = darkMode ? "dark" : "light";

  localStorage.setItem(
    "shopora-theme",
    darkMode ? "dark" : "light"
  );
}, [darkMode]);

function toggleTheme() {
  setDarkMode((current) => !current);
}

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5">
        <Link to="/" className="text-2xl font-extrabold">
          SHOP<span className="text-orange-600">ORA</span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="flex flex-wrap items-center gap-4 text-sm font-medium sm:gap-5"
        >
          <Link to="/" className="transition hover:text-orange-600">
            Home
          </Link>

          <Link to="/products" className="transition hover:text-orange-600">
            Shop
          </Link>

          <Link
            to="/wishlist"
            aria-label={`Wishlist, ${wishlistCount} saved products`}
            className="inline-flex items-center gap-1.5 transition hover:text-orange-600"
          >
            <Heart size={17} />
            Wishlist
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">
              {wishlistCount}
            </span>
          </Link>

          <Link
            to="/cart"
            aria-label={`Cart, ${cartCount} items`}
            className="inline-flex items-center gap-1.5 transition hover:text-orange-600"
          >
            <ShoppingCart size={17} />
            Cart
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">
              {cartCount}
            </span>
          </Link>

          {customer ? (
          <>
            <Link to="/account" className="transition hover:text-orange-600">
              {customer.name}
            </Link>
            <button
              type="button"
              onClick={logout}
              className="font-semibold text-neutral-700 hover:text-orange-600"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link to="/login" className="transition hover:text-orange-600">
            Account
          </Link>
        )}
        <button
  type="button"
  onClick={toggleTheme}
  className="shopora-theme-toggle"
  aria-label={
    darkMode ? "Switch to light mode" : "Switch to dark mode"
  }
  title={darkMode ? "Light mode" : "Dark mode"}
>
  {darkMode ? <Sun size={19} /> : <Moon size={19} />}
</button>
        </nav>
      </div>
    </header>
  );
}
