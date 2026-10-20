import { ArrowLeft, Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCartStore } from "../store/cartStore";
import { useWishlistStore } from "../store/wishlistStore";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

export default function WishlistPage() {
  const items = useWishlistStore((state) => state.items);
  const removeItem = useWishlistStore((state) => state.removeItem);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);
  const addItem = useCartStore((state) => state.addItem);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-orange-600">YOUR COLLECTION</p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-950">
            My Wishlist
          </h1>
          <p className="mt-2 text-neutral-600">
            {items.length} {items.length === 1 ? "product" : "products"} saved
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={clearWishlist}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-red-300 hover:text-red-600"
          >
            Clear wishlist
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <section className="mt-10 rounded-2xl border border-dashed border-neutral-300 px-6 py-16 text-center">
          <Heart size={42} className="mx-auto text-neutral-300" />
          <h2 className="mt-5 text-xl font-semibold text-neutral-900">
            Your wishlist is empty
          </h2>
          <p className="mt-2 text-neutral-600">
            Save products you like and find them here whenever you return.
          </p>
          <Link
            to="/products"
            className="shopora-primary-button mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-3 font-semibold transition-colors"
          >
            <ArrowLeft size={17} />
            Explore products
          </Link>
        </section>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((product) => (
            <article
              key={String(product.id)}
              className="overflow-hidden rounded-xl border border-neutral-200 bg-white"
            >
              <Link
                to={`/products/${product.id}`}
                className="flex aspect-square items-center justify-center overflow-hidden bg-[#f2efe9]"
                aria-label={`View ${product.name}`}
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 hover:scale-105"
                  />
                ) : (
                  <span className="text-6xl">{product.emoji}</span>
                )}
              </Link>

              <div className="p-4">
                {product.category && (
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    {product.category}
                  </p>
                )}

                <Link to={`/products/${product.id}`}>
                  <h2 className="mt-2 font-semibold text-neutral-900 hover:text-orange-600">
                    {product.name}
                  </h2>
                </Link>

                <p className="mt-3 text-lg font-bold text-neutral-950">
                  {formatPrice(product.price)}
                </p>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => addItem(product)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-neutral-950 px-3 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                  >
                    <ShoppingCart size={17} />
                    Add to cart
                  </button>

                  <button
                    type="button"
                    onClick={() => removeItem(product.id)}
                    aria-label={`Remove ${product.name} from wishlist`}
                    className="rounded-lg border border-neutral-200 p-3 text-neutral-600 transition hover:border-red-300 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
