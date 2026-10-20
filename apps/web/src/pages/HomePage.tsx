
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import heroImage from "../assets/hero.png";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Headphones,
  RefreshCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getProducts, type ApiProduct } from "../services/productService";
import ProductCard from "../components/ui/ProductCard";


export default function HomePage() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getProducts()
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load featured products.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

const heroSlides = useMemo(
  () => products.filter((product) => Boolean(product.imageUrl)).slice(0, 5),
  [products],
);

const [heroSlideIndex, setHeroSlideIndex] = useState(0);
const shouldReduceMotion = useReducedMotion();

const activeHeroProduct =
  heroSlides.length > 0
    ? heroSlides[heroSlideIndex % heroSlides.length]
    : undefined;

useEffect(() => {
  if (heroSlides.length < 2 || shouldReduceMotion) return;

  const timer = window.setInterval(() => {
    setHeroSlideIndex((current) => (current + 1) % heroSlides.length);
  }, 5000);

  return () => window.clearInterval(timer);
}, [heroSlides.length, shouldReduceMotion]);

const featuredProducts = products.slice(0, 4);


  return (
    <main className="shopora-home">

<section className="shopora-hero">
<motion.section
  className="shopora-hero shopora-hero--slideshow"
  initial={shouldReduceMotion ? false : { opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.7 }}
>
  <div className="shopora-hero-background" aria-hidden="true">
    <AnimatePresence initial={false}>
      <motion.div
        key={activeHeroProduct?.id ?? "default-hero"}
        className="shopora-hero-background-image"
        style={{
          backgroundImage: `url("${activeHeroProduct?.imageUrl || heroImage}")`,
        }}
        initial={
          shouldReduceMotion
            ? false
            : { opacity: 0, scale: 1.06 }
        }
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 1.2 }}
      />
    </AnimatePresence>
  </div>

  <div className="shopora-hero-shade" />

  <div className="shopora-slideshow-content">
    <motion.div
      className="shopora-slideshow-copy"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15 }}
    >
      <p className="shopora-slideshow-eyebrow">
        <span />
        THE SHOPORA EDIT
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeHeroProduct?.id ?? "hero-heading"}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="shopora-slideshow-title">
            Good things.
            <br />
            Better <span>everyday.</span>
          </h1>

          <p className="shopora-slideshow-description">
            Discover thoughtful essentials, timeless finds, and
            little upgrades that make everyday living feel special.
          </p>

          {activeHeroProduct && (
            <p className="shopora-slideshow-product">
              <span>FEATURED FIND</span>
              {activeHeroProduct.name}
              <strong>
                ₹{Number(activeHeroProduct.price).toLocaleString("en-IN")}
              </strong>
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="shopora-slideshow-actions">
        <Link to="/products" className="shopora-slideshow-primary">
          Explore the collection
          <ArrowRight size={19} />
        </Link>

        {activeHeroProduct?.slug && (
          <Link
            to={`/products/${activeHeroProduct.slug}`}
            className="shopora-slideshow-secondary"
          >
            Discover this find <ArrowUpRight size={17} />
          </Link>
        )}
      </div>

      <div className="shopora-slideshow-benefits">
        <span><CheckCircle2 size={16} /> Thoughtful selection</span>
        <span><CheckCircle2 size={16} /> Everyday essentials</span>
      </div>
    </motion.div>
  </div>

  {heroSlides.length > 1 && (
    <>
      <div className="shopora-slide-indicators" aria-label="Choose hero slide">
        {heroSlides.map((product, index) => (
          <button
            key={product.id}
            type="button"
            aria-label={`Show ${product.name}`}
            aria-current={index === heroSlideIndex ? "true" : undefined}
            className={
              index === heroSlideIndex
                ? "shopora-slide-dot is-active"
                : "shopora-slide-dot"
            }
            onClick={() => setHeroSlideIndex(index)}
          />
        ))}
      </div>

      <div className="shopora-slide-arrows">
        <button
          type="button"
          aria-label="Previous featured product"
          onClick={() =>
            setHeroSlideIndex(
              (current) => (current - 1 + heroSlides.length) % heroSlides.length,
            )
          }
        >
          <ArrowRight className="rotate-180" size={20} />
        </button>

        <button
          type="button"
          aria-label="Next featured product"
          onClick={() =>
            setHeroSlideIndex((current) => (current + 1) % heroSlides.length)
          }
        >
          <ArrowRight size={20} />
        </button>
      </div>
    </>
  )}
</motion.section>

</section>

      <section className="border-b border-[#eeeae3] bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-7 sm:px-8 md:grid-cols-4 lg:px-10">
          <div className="flex items-center gap-3">
            <Truck className="shrink-0 text-[#9a603e]" size={21} />
            <div>
              <p className="text-sm font-semibold text-[#292821]">Delivery</p>
              <p className="mt-1 text-xs text-neutral-500">Details at checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="shrink-0 text-[#9a603e]" size={21} />
            <div>
              <p className="text-sm font-semibold text-[#292821]">Secure checkout</p>
              <p className="mt-1 text-xs text-neutral-500">Protected shopping</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RefreshCcw className="shrink-0 text-[#9a603e]" size={21} />
            <div>
              <p className="text-sm font-semibold text-[#292821]">Returns</p>
              <p className="mt-1 text-xs text-neutral-500">See our policy</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Headphones className="shrink-0 text-[#9a603e]" size={21} />
            <div>
              <p className="text-sm font-semibold text-[#292821]">Need help?</p>
              <p className="mt-1 text-xs text-neutral-500">We're here to help</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#9a603e]">
              Selected for you
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#292821] sm:text-4xl">
              The latest finds
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-neutral-500 sm:text-base">
              Explore products chosen to bring a little more joy to your
              everyday routine.
            </p>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#292821] transition hover:text-[#9a603e]"
          >
            View all products <ArrowUpRight size={17} />
          </Link>
        </div>

        {loading ? (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="animate-pulse"
                aria-label="Loading product"
              >
                <div className="aspect-[4/4.5] rounded-2xl bg-[#f0ede7]" />
                <div className="mt-4 h-4 w-3/4 rounded bg-[#f0ede7]" />
                <div className="mt-3 h-4 w-1/3 rounded bg-[#f0ede7]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-10 rounded-2xl border border-[#e8ddd2] bg-[#faf7f2] px-6 py-10 text-center">
            <h3 className="text-lg font-semibold text-[#292821]">
              We couldn't load the collection
            </h3>
            <p role="alert" className="mt-2 text-sm text-neutral-600">
              {error}
            </p>
            <Link
              to="/products"
              className="mt-5 inline-flex rounded-full bg-[#292821] px-6 py-3 text-sm font-semibold text-white"
            >
              Browse products
            </Link>
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={{
  id: product.id,
  name: product.name,
  price: Number(product.price),
  emoji: product.emoji || "🛍️",
  imageUrl: product.imageUrl,
  category: product.category.name,
  originalPrice: product.originalPrice,
}}
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-[#d9d1c5] px-6 py-14 text-center">
            <p className="text-lg font-semibold text-[#292821]">
              A fresh collection is on its way
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              Check back soon or browse our full catalogue.
            </p>
            <Link
              to="/products"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#9a603e]"
            >
              Browse all products <ArrowRight size={16} />
            </Link>
          </div>
        )}

        <div className="mt-16 overflow-hidden rounded-[2rem] bg-[#292821] px-6 py-10 text-white sm:px-10 sm:py-14 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d8b79c]">
              Your everyday, elevated
            </p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
              A better find is just around the corner.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/65">
              Take a look through the collection and discover something you'll
              love to use.
            </p>
          </div>
          <Link
            to="/products"
            className="shopora-primary-button inline-flex items-center justify-center gap-3 rounded-full bg-neutral-950 px-7 py-4 text-sm font-bold text-white opacity-100 shadow-md transition-colors hover:bg-orange-600"
          >
            Shop all products <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </main>
  );
}
