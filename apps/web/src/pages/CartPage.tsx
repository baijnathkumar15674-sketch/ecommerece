
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../store/cartStore";
import { useAuth } from "../auth/auth";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const subtotal = useCartStore((state) => state.getSubtotal());
  const { customer, loading } = useAuth();
  const navigate = useNavigate();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  const handleCheckout = () => {
    if (loading) return;

    if (!customer) {
      navigate("/login", {
        state: { from: "/checkout" },
      });
      return;
    }

    navigate("/checkout");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 p-10 text-center">
        Checking login...
      </main>
    );
  }

  if (!customer) {
    return (
      <main className="min-h-screen bg-neutral-50 px-4 py-20 text-center">
        <ShoppingBag className="mx-auto text-neutral-400" size={48} />
        <h1 className="mt-5 text-2xl font-bold text-neutral-950">
          Login Required
        </h1>
        <p className="mx-auto mt-3 max-w-md text-neutral-600">
          Cart, checkout aur payment use karne ke liye pehle apne account mein
          login karein.
        </p>
        <button
          type="button"
          onClick={() =>
            navigate("/login", {
              state: { from: "/cart" },
            })
          }
          className="shopora-primary-button mt-6 rounded-lg px-6 py-3 font-semibold"
        >
          Login to Continue
        </button>
        <div>
          <Link
            to="/products"
            className="mt-5 inline-block text-sm text-neutral-600 hover:text-orange-600"
          >
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto max-w-7xl px-4 py-12">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-orange-600"
        >
          <ArrowLeft size={18} />
          Continue shopping
        </Link>

        <h1 className="mt-6 text-3xl font-extrabold text-neutral-950 sm:text-4xl">
          Your Shopping Cart
        </h1>

        <p className="mt-2 text-neutral-600">
          {items.length} {items.length === 1 ? "product" : "products"} in your cart
        </p>

        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-neutral-200 bg-white px-6 py-16 text-center">
            <ShoppingBag className="mx-auto text-neutral-400" size={48} />
            <h2 className="mt-5 text-xl font-bold">Your cart is empty</h2>
            <p className="mt-2 text-neutral-600">
              Discover something you'll love in our collection.
            </p>
            <Link
              to="/products"
              className="shopora-primary-button mt-6 inline-flex rounded-lg px-6 py-3 font-semibold transition-colors"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            <section className="space-y-4 lg:col-span-2">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex h-28 w-full shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-5xl sm:w-28">
                    {item.emoji}
                  </div>

                  <div className="min-w-0 flex-1">
                    {item.category && (
                      <p className="text-xs uppercase tracking-wide text-neutral-500">
                        {item.category}
                      </p>
                    )}
                    <h2 className="mt-1 font-semibold text-neutral-950">
                      {item.name}
                    </h2>
                    <p className="mt-2 font-bold">{formatPrice(item.price)}</p>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <div className="flex items-center rounded-lg border border-neutral-300">
                      <button
                        type="button"
                        aria-label={`Decrease ${item.name} quantity`}
                        disabled={item.quantity <= 1}
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="p-2 disabled:opacity-40"
                      >
                        <Minus size={16} />
                      </button>

                      <span className="min-w-9 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        aria-label={`Increase ${item.name} quantity`}
                        disabled={item.quantity >= 10}
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="p-2 disabled:opacity-40"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>

                  <p className="font-bold sm:w-28 sm:text-right">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </article>
              ))}
            </section>

            <aside className="h-fit rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="text-xl font-bold">Order summary</h2>

              <div className="mt-6 flex justify-between text-sm">
                <span className="text-neutral-600">Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>

              <div className="mt-4 flex justify-between text-sm">
                <span className="text-neutral-600">Shipping</span>
                <span className="font-semibold">Calculated at checkout</span>
              </div>

              <div className="mt-6 border-t border-neutral-200 pt-5">
                <div className="flex justify-between gap-3">
                  <span className="font-bold">Estimated total</span>
                  <span className="text-lg font-extrabold">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  Shipping and applicable taxes may be added at checkout.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                className="shopora-primary-button mt-6 flex w-full items-center justify-center rounded-lg px-5 py-4 font-semibold transition-colors"
              >
                Proceed to checkout
              </button>

              <button
                type="button"
                onClick={() => useCartStore.getState().clearCart()}
                className="shopora-secondary-button mt-3 w-full rounded-lg px-5 py-3 text-sm font-semibold transition-colors"
              >
                Clear cart
              </button>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
