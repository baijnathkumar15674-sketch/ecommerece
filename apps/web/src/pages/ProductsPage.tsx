
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import ProductCard from "../components/ui/ProductCard";
import { getProducts, type ApiProduct } from "../services/productService";

export default function ProductsPage() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [stockFilter, setStockFilter] = useState("all");

  useEffect(() => {
    let active = true;

    getProducts()
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load products."
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

  const categories = [
  "All",
  "Accessories",
  "Beauty & Personal Care",
  "Books",
  "Electronics",
  "Fashion",
  "Home & Kitchen",
  "Sports & Fitness",
  "Toys & Games",
];

  
const filteredProducts = useMemo(() => {
  const query = search.trim().toLowerCase();

  const result = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(query) ||
      product.category.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query);

    const matchesCategory =
      category === "All" || product.category.name === category;

    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "in-stock" && product.stock > 0) ||
      (stockFilter === "out-of-stock" && product.stock <= 0);

    return matchesSearch && matchesCategory && matchesStock;
  });

  if (sort === "price-low") {
    result.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sort === "price-high") {
    result.sort((a, b) => Number(b.price) - Number(a.price));
  } else if (sort === "name") {
    result.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "featured") {
    result.sort((a, b) => {
      const stockOrder = Number(b.stock > 0) - Number(a.stock > 0);
      return stockOrder || a.name.localeCompare(b.name);
    });
  }

  return result;
}, [products, search, category, stockFilter, sort]);


  if (loading) {
    return <main className="mx-auto max-w-7xl px-4 py-20">Loading products...</main>;
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Unable to load products</h1>
        <p role="alert" className="mt-3 text-neutral-600">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 rounded-lg bg-neutral-950 px-5 py-3 text-white"
        >
          Try again
        </button>
      </main>
    );
  }

  return (

<main className="products-page min-h-screen">
  <section className="products-banner px-4 py-12 sm:py-16">
  <div className="mx-auto max-w-7xl">
    <p className="products-banner-label font-semibold uppercase tracking-widest">
      SHOPORA COLLECTION
    </p>

    <h1 className="products-banner-title mt-3 text-4xl font-extrabold sm:text-5xl">
      All Products
    </h1>

    <p className="products-banner-description mt-4 max-w-xl leading-7">
      Find your everyday essentials and discover products selected for your lifestyle.
    </p>
  </div>
</section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="w-full rounded-lg border border-neutral-300 py-3 pl-11 pr-4 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          
<div className="flex flex-col gap-3 sm:flex-row">
  <div className="flex items-center gap-2">
    <SlidersHorizontal size={18} />
    <label htmlFor="category" className="text-sm font-medium">
      Category
    </label>
    <select
      id="category"
      value={category}
      onChange={(event) => setCategory(event.target.value)}
      aria-label="Filter by category"
      className="rounded-lg border border-neutral-300 px-3 py-3"
    >
      {categories.map((item) => (
        <option key={item} value={item}>
          {item === "All" ? "All categories" : item}
        </option>
      ))}
    </select>
  </div>

  {/* Insert the new stock filter here */}
  <select
    value={stockFilter}
    onChange={(event) => setStockFilter(event.target.value)}
    aria-label="Filter by stock availability"
    className="rounded-lg border border-neutral-300 px-3 py-3"
  >
    <option value="all">All availability</option>
    <option value="in-stock">In stock</option>
    <option value="out-of-stock">Out of stock</option>
  </select>

  {/* Keep your existing sort dropdown here */}
  <select
    value={sort}
    onChange={(event) => setSort(event.target.value)}
    aria-label="Sort products"
    className="rounded-lg border border-neutral-300 px-3 py-3"
  >
    <option value="featured">Featured</option>
    <option value="price-low">Price: Low to high</option>
    <option value="price-high">Price: High to low</option>
    <option value="name">Name: A to Z</option>
  </select>
</div>

        </div>

        <div className="mb-6 mt-8">
          <p className="text-sm text-neutral-600">
            Showing {filteredProducts.length} products
          </p>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  name: product.name,
                  imageUrl: product.imageUrl,
                  price: Number(product.price),
                  emoji: "🛍️",
                  category: product.category.name,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-300 py-16 text-center">
            <h2 className="text-xl font-bold">No products found</h2>
            <p className="mt-2 text-neutral-600">
              Try another search term or category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("All");
                setSort("featured");
              }}
              className="mt-5 rounded-lg bg-neutral-950 px-5 py-3 font-semibold text-white hover:bg-orange-600"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
