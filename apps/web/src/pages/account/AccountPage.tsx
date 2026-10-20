
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../auth/auth";
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const TOKEN_KEY = "shopora_customer_token";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: string;
};

type StatusEvent = {
  id: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  changedAt: string;
};

type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  subtotal: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  statusHistory: StatusEvent[];
};

const STEPS: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

const LABELS: Record<OrderStatus, string> = {
  PENDING: "Order placed",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatMoney(value: string | number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function statusClasses(status: OrderStatus) {
  switch (status) {
    case "DELIVERED":
      return "bg-green-100 text-green-800";
    case "SHIPPED":
      return "bg-blue-100 text-blue-800";
    case "PROCESSING":
      return "bg-violet-100 text-violet-800";
    case "CONFIRMED":
      return "bg-cyan-100 text-cyan-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

function TrackingTimeline({ order }: { order: Order }) {
  if (order.status === "CANCELLED") {
    return (
      <div className="mt-5 rounded-lg bg-red-50 p-4 text-red-800">
        <strong>Order cancelled</strong>
        <p className="mt-1 text-sm">
          This order will not progress through the delivery stages.
        </p>
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(order.status);
  const history = order.statusHistory ?? [];

  return (
    <ol className="mt-6 space-y-5">
      {STEPS.map((step, index) => {
        const completed = index <= currentIndex;
        const event = [...history]
          .reverse()
          .find((item) => item.newStatus === step);

        const initialPlacement =
          step === "PENDING" && !event;

        const isCurrent = index === currentIndex;

        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ${
                  completed
                    ? "bg-black text-white"
                    : "border border-neutral-300 text-neutral-400"
                }`}
              >
                {completed ? "✓" : index + 1}
              </span>

              {index < STEPS.length - 1 && (
                <span
                  className={`mt-1 min-h-5 w-px flex-1 ${
                    index < currentIndex
                      ? "bg-black"
                      : "bg-neutral-200"
                  }`}
                />
              )}
            </div>

            <div className="pb-2">
              <p className="font-medium">{LABELS[step]}</p>

              {event ? (
                <p className="mt-1 text-sm text-neutral-500">
                  {formatDate(event.changedAt)}
                </p>
              ) : initialPlacement ? (
                <p className="mt-1 text-sm text-neutral-500">
                  {formatDate(order.createdAt)}
                </p>
              ) : isCurrent ? (
                <p className="mt-1 text-sm text-neutral-500">
                  Current status
                </p>
              ) : (
                <p className="mt-1 text-sm text-neutral-400">
                  Awaiting update
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function getEstimatedDeliveryDate(
  createdAt: string,
): Date {
  const deliveryDate = new Date(createdAt);

  // Initial estimate: 5 calendar days after order placement.
  deliveryDate.setDate(deliveryDate.getDate() + 5);

  return deliveryDate;
}

function formatDeliveryDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AccountPage() {

const { customer, loading, logout, updateProfile } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
const [profileSaving, setProfileSaving] = useState(false);
const [profileError, setProfileError] = useState("");

const [profileForm, setProfileForm] = useState({
  name: customer?.name ?? "",
  email: customer?.email ?? "",
  phone: customer?.phone ?? "",
});

  useEffect(() => {
    if (loading || !customer) return;

    const controller = new AbortController();

    async function loadOrders() {
      setOrdersLoading(true);
      setError("");

      try {
        const token = sessionStorage.getItem(TOKEN_KEY);

        if (!token) {
          throw new Error("Your session has expired. Please sign in again.");
        }

        const response = await fetch(
          `${API_BASE_URL}/orders/my-orders`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            typeof data?.message === "string"
              ? data.message
              : `Unable to load orders (${response.status}).`
          );
        }

        if (!Array.isArray(data)) {
          throw new Error("The orders API returned an unexpected response.");
        }

        setOrders(data as Order[]);
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your orders."
        );
      } finally {
        if (!controller.signal.aborted) {
          setOrdersLoading(false);
        }
      }
    }

    void loadOrders();

    return () => controller.abort();
  }, [customer, loading]);

  const stats = useMemo(() => {
    const delivered = orders.filter(
      (order) => order.status === "DELIVERED"
    ).length;

    const inProgress = orders.filter((order) =>
      ["CONFIRMED", "PROCESSING", "SHIPPED"].includes(order.status)
    ).length;

    const pending = orders.filter(
      (order) => order.status === "PENDING"
    ).length;

    const totalValue = orders
      .filter((order) => order.status !== "CANCELLED")
      .reduce((sum, order) => sum + Number(order.subtotal || 0), 0);

    return {
      total: orders.length,
      delivered,
      inProgress,
      pending,
      totalValue,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (filter === "ALL") return orders;

    if (filter === "IN_PROGRESS") {
      return orders.filter((order) =>
        ["CONFIRMED", "PROCESSING", "SHIPPED"].includes(order.status)
      );
    }

    return orders.filter((order) => order.status === filter);
  }, [orders, filter]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16">
        Loading account…
      </main>
    );
  }

  if (!customer) {
    return (
      <Navigate to="/login" replace state={{ from: "/account" }} />
    );
  }
  const handleProfileSave = async (
  event: React.FormEvent<HTMLFormElement>,
) => {
  event.preventDefault();
  setProfileSaving(true);
  setProfileError("");

  try {
    await updateProfile({
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
      phone: profileForm.phone.trim(),
    });

    setIsEditingProfile(false);
  } catch (error) {
    setProfileError(
      error instanceof Error
        ? error.message
        : "Unable to update your profile.",
    );
  } finally {
    setProfileSaving(false);
  }
};

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My account</h1>
          <p className="mt-2 text-neutral-600">
            Welcome back, {customer.name}.
          </p>
        </div>

        <Link
          to="/products"
          className="rounded-lg bg-black px-5 py-3 font-semibold text-white continue-shopping-btn"
        >
          Continue shopping
        </Link>
      </div>

{/* <div className="profile-edit-header"> */}

<section className="profile-card">
  <div className="profile-card-heading">
    <div>
      <h2>Profile details</h2>
      <p>Manage your personal information</p>
    </div>

    {!isEditingProfile && (
      <button
        type="button"
        className="profile-edit-button"
        onClick={() => {
          setProfileError("");
          setProfileForm({
            name: customer?.name ?? "",
            email: customer?.email ?? "",
            phone: customer?.phone ?? "",
          });
          setIsEditingProfile(true);
        }}
      >
        <span aria-hidden="true">✎</span>
        Edit profile
      </button>
    )}
  </div>

  {isEditingProfile ? (
    <form
      className="profile-edit-form"
      onSubmit={handleProfileSave}
    >
      <div className="profile-form-grid">
        <label>
          Full name
          <input
            type="text"
            required
            minLength={2}
            maxLength={100}
            value={profileForm.name}
            onChange={(e) =>
              setProfileForm((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            placeholder="Enter your full name"
          />
        </label>

        <label>
          Email address
          <input
            type="email"
            required
            maxLength={254}
            value={profileForm.email}
            onChange={(e) =>
              setProfileForm((prev) => ({
                ...prev,
                email: e.target.value,
              }))
            }
            placeholder="Enter your email"
          />
        </label>

        <label>
          Phone number
          <input
            type="tel"
            maxLength={20}
            value={profileForm.phone}
            onChange={(e) =>
              setProfileForm((prev) => ({
                ...prev,
                phone: e.target.value,
              }))
            }
            placeholder="Enter your phone number"
          />
        </label>
      </div>

      {profileError && (
        <p className="profile-error" role="alert">
          {profileError}
        </p>
      )}

      <div className="profile-form-actions">
        <button
          type="button"
          className="profile-cancel-button"
          disabled={profileSaving}
          onClick={() => {
            setIsEditingProfile(false);
            setProfileError("");
            setProfileForm({
              name: customer?.name ?? "",
              email: customer?.email ?? "",
              phone: customer?.phone ?? "",
            });
          }}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="profile-save-button"
          disabled={profileSaving}
        >
          {profileSaving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  ) : (
    <div className="profile-details-grid">
      <div className="profile-detail">
        <span className="profile-detail-label">FULL NAME</span>
        <strong>{customer?.name || "Not provided"}</strong>
      </div>

      <div className="profile-detail">
        <span className="profile-detail-label">EMAIL ADDRESS</span>
        <strong title={customer?.email || ""}>
          {customer?.email || "Not provided"}
        </strong>
      </div>

      <div className="profile-detail">
        <span className="profile-detail-label">PHONE NUMBER</span>
        <strong>{customer?.phone || "Not provided"}</strong>
      </div>
    </div>
  )}
</section>


      
      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Order dashboard</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Track orders and review your shopping activity.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Total orders", value: stats.total },
            { label: "In progress", value: stats.inProgress },
            { label: "Delivered", value: stats.delivered },
            { label: "Pending", value: stats.pending },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-neutral-200 p-4 sm:p-5"
            >
              <p className="text-sm text-neutral-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold">
                {ordersLoading ? "—" : stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-neutral-200 p-5">
          <p className="text-sm text-neutral-500">
            Total order value excluding cancelled orders
          </p>
          <p className="mt-2 text-2xl font-bold">
            {ordersLoading ? "Loading…" : formatMoney(stats.totalValue)}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            This is order value, not necessarily money paid or retained
            after refunds.
          </p>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Your orders</h2>

          <label className="text-sm">
            <span className="sr-only">Filter orders</span>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2"
            >
              <option value="ALL">All orders</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
        </div>

        {ordersLoading && (
          <p className="mt-5 text-neutral-500">Loading your orders…</p>
        )}

        {error && !ordersLoading && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
            <p className="font-semibold">Unable to load orders</p>
            <p className="mt-1 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 rounded-lg border border-red-300 px-4 py-2 font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {!ordersLoading && !error && filteredOrders.length === 0 && (
          <div className="mt-5 rounded-xl border border-neutral-200 p-8 text-center">
            <h3 className="text-lg font-semibold">
              {orders.length === 0 ? "No orders yet" : "No matching orders"}
            </h3>
            <p className="mt-2 text-neutral-500">
              {orders.length === 0
                ? "Your orders will appear here after checkout."
                : "Try selecting a different status filter."}
            </p>

            {orders.length === 0 && (
              <Link
                to="/products"
                className="mt-4 inline-block rounded-lg bg-black px-5 py-3 font-semibold text-white continue-shopping-btn"
              >
                Explore products
              </Link>
            )}
          </div>
        )}

        <div className="mt-5 space-y-4">
          {filteredOrders.map((order) => {
            const expanded = expandedOrder === order.id;

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-xl border border-neutral-200"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-neutral-500">Order number</p>
                      <h3 className="mt-1 font-bold">
                        #{order.orderNumber}
                      </h3>
                      <p className="mt-2 text-sm text-neutral-500">
                        Placed {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(order.status)}`}
                    >
                      {LABELS[order.status]}
                    </span>
                  </div>

                  <div className="mt-5 border-t border-neutral-100 pt-4">
                    <p className="font-medium">
                      {order.items.length}{" "}
                      {order.items.length === 1 ? "product" : "products"}
                    </p>

                    <ul className="mt-2 space-y-1 text-sm text-neutral-600">
                      {order.items.map((item) => (
                        <li key={item.productId}>
                          {item.name} × {item.quantity}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-neutral-500">Order total</p>
                        <p className="text-lg font-bold">
                          {formatMoney(order.subtotal)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedOrder(expanded ? null : order.id)
                        }
                        aria-expanded={expanded}
                        className="rounded-lg border border-neutral-300 px-4 py-2 font-semibold"
                      >
                        {expanded ? "Hide tracking" : "Track order"}
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="mt-6 border-t border-neutral-200 pt-5">
                      <h4 className="text-lg font-semibold">
                        Order tracking
                      </h4>
                      <p className="mt-1 text-sm text-neutral-500">
                        Payment status: {order.paymentStatus}
                      </p>
                      <TrackingTimeline order={order} />
                    </div>
                  )}
                </div>

{order.status === "DELIVERED" ? (
  <div className="delivery-estimate delivery-complete">
    <span className="delivery-estimate-icon">✓</span>
    <div>
      <p className="delivery-estimate-label">DELIVERY STATUS</p>
      <strong>Delivered successfully</strong>
    </div>
  </div>
) : order.status === "CANCELLED" ? (
  <div className="delivery-estimate delivery-cancelled">
    <span className="delivery-estimate-icon">!</span>
    <div>
      <p className="delivery-estimate-label">DELIVERY STATUS</p>
      <strong>Order cancelled</strong>
    </div>
  </div>
) : (
  <div className="delivery-estimate">
    <span className="delivery-estimate-icon">▦</span>
    <div>
      <p className="delivery-estimate-label">
        ESTIMATED DELIVERY
      </p>
      <strong>
        {formatDeliveryDate(
          getEstimatedDeliveryDate(order.createdAt)
        )}
      </strong>
      <p className="delivery-estimate-note">
        Expected arrival based on your order date
      </p>
    </div>
  </div>
)}

              </article>
            );
          })}
        </div>
      </section>

      <button
        type="button"
        onClick={logout}
        className="mt-8 rounded-lg border border-neutral-300 px-5 py-3 font-semibold"
      >
        Sign out
      </button>
    </main>
  );
}
