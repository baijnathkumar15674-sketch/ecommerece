import { Heart, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useCartStore } from "../../store/cartStore";
import { useWishlistStore } from "../../store/wishlistStore";
import type { Product } from "../../types/product";
import { useNavigate } from "react-router-dom";

type ProductCardProps = {
  product: Product;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const toggleItem = useWishlistStore((state) => state.toggleItem);
  const isSaved = useWishlistStore((state) => state.isSaved(product.id));

  return (
    <article className="group overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative">
        <Link
          to={`/products/${product.id}`}
          aria-label={`View ${product.name}`}
          className="flex aspect-square items-center justify-center overflow-hidden bg-[#f2efe9]"
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="text-6xl" aria-label="Product image unavailable">
              {product.emoji}
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={() => toggleItem(product)}
          aria-label={
            isSaved
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          aria-pressed={isSaved}
          className={`absolute right-3 top-3 rounded-full bg-white p-2.5 shadow-sm transition hover:scale-105 ${
            isSaved ? "text-red-600" : "text-neutral-600 hover:text-red-600"
          }`}
        >
          <Heart size={19} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="p-4">
        {product.category && (
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {product.category}
          </p>
        )}

        <Link to={`/products/${product.id}`}>
          <h3 className="mt-2 font-semibold text-neutral-900 transition group-hover:text-orange-600">
            {product.name}
          </h3>
        </Link>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-bold text-neutral-950">
            {formatPrice(product.price)}
          </span>

          {product.originalPrice && (
            <span className="text-sm text-neutral-500 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        <div className="mt-4 flex gap-2">
        
        <button
          type="button"
          onClick={() => {
            addItem(product);
            navigate("/cart");
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-neutral-950 px-3 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          <ShoppingCart size={17} />
          Add to cart
        </button>


          <button
            type="button"
            onClick={() => toggleItem(product)}
            aria-label={
              isSaved
                ? `Remove ${product.name} from wishlist`
                : `Save ${product.name}`
            }
            aria-pressed={isSaved}
            className={`rounded-lg border p-3 transition ${
              isSaved
                ? "border-red-300 text-red-600"
                : "border-neutral-200 hover:border-orange-500 hover:text-orange-600"
            }`}
          >
            <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </article>
  );
}
