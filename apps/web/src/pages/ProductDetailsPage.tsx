
import { useEffect, useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingCart } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getProduct, type ApiProduct } from "../services/productService";
import { useCartStore } from "../store/cartStore";

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (!id) {
      setError("Product ID is missing.");
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    getProduct(id)
      .then((result) => {
        if (active) {
          setProduct(result);
          setSelectedImage(0);
          setQuantity(1);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load product."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const formatPrice = (price: number | string) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(price));

  const galleryImages = product
    ? [
        ...(product.images ?? [])
          .filter((image) => Boolean(image.url))
          .sort(
            (a, b) =>
              Number(b.isPrimary) - Number(a.isPrimary) ||
              a.sortOrder - b.sortOrder
          )
          .map((image) => ({
            url: image.url,
            alt: image.alt || product.name,
          })),
        ...(product.images?.length
          ? []
          : product.imageUrl
            ? [{ url: product.imageUrl, alt: product.name }]
            : []),
      ]
    : [];

  const activeImage = galleryImages[selectedImage] ?? galleryImages[0];

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-20">
        Loading product...
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">
          {error ? "Unable to load product" : "Product not found"}
        </h1>
        <p role="alert" className="mt-3 text-neutral-600">
          {error || "This product does not exist in our current collection."}
        </p>
        <Link
          to="/products"
          className="mt-6 inline-block rounded-lg bg-neutral-950 px-5 py-3 font-semibold text-white"
        >
          Browse products
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-10">
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-orange-600"
      >
        <ArrowLeft size={18} />
        Back to products
      </Link>

      <section className="mt-8 grid gap-10 md:grid-cols-2 md:gap-16">
        <div className="space-y-4">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-neutral-100">
            {activeImage ? (
              <img
                key={activeImage.url}
                src={activeImage.url}
                alt={activeImage.alt}
                className="h-full w-full object-contain"
              />
            ) : (
              <span
                className="text-8xl"
                aria-label="Product image unavailable"
              >
                🛍️
              </span>
            )}
          </div>

          {galleryImages.length > 1 && (
            <div
              className="flex gap-3 overflow-x-auto pb-2"
              aria-label="Product image thumbnails"
            >
              {galleryImages.map((image, index) => (
                <button
                  key={`${image.url}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  aria-label={`View product image ${index + 1}`}
                  aria-pressed={selectedImage === index}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${
                    selectedImage === index
                      ? "border-orange-600"
                      : "border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="py-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
            {product.category.name}
          </p>

          <h1 className="mt-3 text-3xl font-extrabold text-neutral-950 sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-5">
            <span className="text-2xl font-bold">
              {formatPrice(product.price)}
            </span>
          </div>

          <p className="mt-6 leading-7 text-neutral-600">
            {product.description || `Discover ${product.name} from SHOPORA.`}
          </p>

          <p style={{ color: "#dc2626", fontSize:24 , fontWeight: 900 }} className="mt-3 text-sm text-neutral-600">
            {product.stock > 0
              ? `${product.stock} available in stock`
              : "Currently out of stock"}
          </p>

          <div className="mt-8">
            <label className="text-sm font-semibold">Quantity</label>

            <div className="mt-3 flex w-fit items-center rounded-lg border border-neutral-300">
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={quantity <= 1}
                onClick={() =>
                  setQuantity((current) => Math.max(1, current - 1))
                }
                className="p-3 disabled:opacity-40"
              >
                <Minus size={17} />
              </button>

              <span className="min-w-12 text-center font-semibold">
                {quantity}
              </span>

              <button
                type="button"
                aria-label="Increase quantity"
                disabled={quantity >= 10 || quantity >= product.stock}
                onClick={() =>
                  setQuantity((current) =>
                    Math.min(10, product.stock ?? 0, current + 1)
                  )
                }
                className="p-3 disabled:opacity-40"
              >
                <Plus size={17} />
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={product.stock <= 0 || quantity > product.stock}
            onClick={() => {
              addItem(
                {
                  id: product.id,
                  name: product.name,
                  price: Number(product.price),
                  imageUrl: activeImage?.url ?? product.imageUrl ?? null,
                  emoji: "🛍️",
                  category: product.category.name,
                },
                quantity
              );
            }}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-950 px-6 py-4 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart size={19} />
            {product.stock > 0 ? "Add to cart" : "Out of stock"}
          </button>

          <p className="mt-4 text-sm text-neutral-500">
            Prices are displayed in Indian Rupees (INR).
          </p>
        </div>
      </section>
    </main>
  );
}
