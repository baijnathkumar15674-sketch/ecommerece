
import { Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-neutral-950 text-neutral-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Link to="/" className="text-2xl font-extrabold text-white">
            SHOP<span className="text-orange-500">ORA</span>
          </Link>

          <p className="mt-4 max-w-xs text-sm leading-6 text-neutral-400">
            Discover everyday essentials, explore new collections, and enjoy
            a better shopping experience.
          </p>

        </div>

        <div>
          <h2 className="font-semibold text-white">Shop</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li><Link to="/products" className="hover:text-orange-400">All products</Link></li>
            <li><Link to="/products?sort=newest" className="hover:text-orange-400">New arrivals</Link></li>
            <li><Link to="/products?sort=popular" className="hover:text-orange-400">Best sellers</Link></li>
            <li><Link to="/wishlist" className="hover:text-orange-400">Wishlist</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-white">Customer service</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li><Link to="/contact" className="hover:text-orange-400">Contact us</Link></li>
            <li><Link to="/faq" className="hover:text-orange-400">FAQs</Link></li>
            <li><Link to="/policies/shipping" className="hover:text-orange-400">Shipping policy</Link></li>
            <li><Link to="/policies/returns" className="hover:text-orange-400">Returns and refunds</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-white">Contact</h2>
          <div className="mt-4 space-y-4 text-sm">
            <p className="flex items-center gap-3">
              <Mail size={17} className="shrink-0 text-orange-400" />
              <a href="mailto:support@example.com">support@example.com</a>
            </p>
            <p className="flex items-center gap-3">
              <Phone size={17} className="shrink-0 text-orange-400" />
              <span>Contact details coming soon</span>
            </p>
          </div>
          <p className="mt-4 text-xs leading-5 text-neutral-500">
            Replace these demonstration contact details before launch.
          </p>
        </div>
      </div>

      <div className="border-t border-neutral-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} SHOPORA. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/policies/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/policies/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
