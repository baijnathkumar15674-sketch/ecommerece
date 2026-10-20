
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LockKeyhole, } from "lucide-react";
import { useCartStore } from "../store/cartStore";


type CheckoutForm = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
};

const initialForm: CheckoutForm = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
};

export default function CheckoutPage() {
  const items = useCartStore((store) => store.items);
  const subtotal = useCartStore((store) => store.getSubtotal());
  const clearCart = useCartStore((store) => store.clearCart);

  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [errors, setErrors] = useState<Partial<CheckoutForm>>({});
  const [orderMessage, setOrderMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  function updateField(field: keyof CheckoutForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setOrderMessage("");
  }


async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (isSubmitting) return;

  const nextErrors: Partial<CheckoutForm> = {};

  if (form.fullName.trim().length < 2) {
    nextErrors.fullName = "Enter your full name.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    nextErrors.email = "Enter a valid email address.";
  }

  if (!/^[6-9]\d{9}$/.test(form.phone)) {
    nextErrors.phone = "Enter a valid 10-digit Indian mobile number.";
  }

  if (form.address.trim().length < 8) {
    nextErrors.address = "Enter your complete delivery address.";
  }

  if (!form.city.trim()) nextErrors.city = "Enter your city.";
  if (!form.state.trim()) nextErrors.state = "Enter your state.";

  if (!/^\d{6}$/.test(form.postalCode)) {
    nextErrors.postalCode = "Enter a valid 6-digit PIN code.";
  }

  setErrors(nextErrors);
  setOrderMessage("");

  if (Object.keys(nextErrors).length > 0) return;

if (items.length === 0) {
  setOrderMessage("Your cart is empty. Add products before checkout.");
  return;
}
  setIsSubmitting(true);

  try {
    const apiBaseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:3000"
    ).replace(/\/+$/, "");

   
const token = sessionStorage.getItem("shopora_customer_token");

if (!token) {
  setOrderMessage("Please sign in before placing an order.");
  return;
}

const response = await fetch(`${apiBaseUrl}/orders/customer`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    customerName: form.fullName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    postalCode: form.postalCode.trim(),
    items: items.map((item) => ({
      productId: String(item.id),
      quantity: item.quantity,
    })),
  }),
});

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = Array.isArray(result.message)
        ? result.message.join(" ")
        : result.message;

      throw new Error(
        message || `Order creation failed (${response.status}).`,
      );
    }

    if (!result.orderNumber) {
      throw new Error("The server did not return an order number.");
    }

    setOrderNumber(result.orderNumber);
    clearCart();
  } catch (error) {
    setOrderMessage(
      error instanceof Error
        ? error.message
        : "Unable to place your order. Please try again.",
    );
  } finally {
    setIsSubmitting(false);
  }
}


  const fields: {
    name: keyof CheckoutForm;
    label: string;
    placeholder: string;
    type?: string;
    wide?: boolean;
    autoComplete?: string;
  }[] = [
    {
      name: "fullName",
      label: "Full name",
      placeholder: "Enter your full name",
      autoComplete: "name",
      wide: true,
    },
    {
      name: "email",
      label: "Email address",
      placeholder: "you@example.com",
      type: "email",
      autoComplete: "email",
      wide: true,
    },
    {
      name: "phone",
      label: "Mobile number",
      placeholder: "10-digit mobile number",
      type: "tel",
      autoComplete: "tel",
    },
    {
      name: "postalCode",
      label: "PIN code",
      placeholder: "6-digit PIN code",
      autoComplete: "postal-code",
    },
    {
      name: "address",
      label: "Delivery address",
      placeholder: "House number, street, area",
      autoComplete: "street-address",
      wide: true,
    },
    {
      name: "city",
      label: "City",
      placeholder: "Enter your city",
      autoComplete: "address-level2",
    },
    {
      name: "state",
      label: "State",
      placeholder: "Enter your state",
      autoComplete: "address-level1",
    },
  ];


if (orderNumber) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="text-5xl">✓</div>
      <h1 className="mt-5 text-3xl font-bold text-neutral-950">
        Order placed successfully!
      </h1>
      <p className="mt-3 text-neutral-600">
        Your order has been saved.
      </p>
      <p className="mt-4 rounded-lg bg-neutral-100 p-4 font-semibold">
        Order number: {orderNumber}
      </p>
      <Link
        to="/products"
       className="inline-flex items-center justify-center rounded-lg border border-black bg-black px-6 py-3 font-semibold !text-white opacity-100 shadow-sm transition-colors duration-200 hover:border-orange-600 hover:bg-orange-600 hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
      >
        Continue shopping
      </Link>
    </main>
  );
}


  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-orange-600"
        >
          <ArrowLeft size={18} />
          Back to cart
        </Link>

        <h1 className="mt-6 text-3xl font-extrabold text-neutral-950 sm:text-4xl">
          Checkout
        </h1>
        <p className="mt-2 text-neutral-600">
          Enter your delivery details and review your order.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-6 rounded-xl border border-neutral-200 bg-white p-6 lg:col-span-2"
          >
            <h2 className="text-xl font-bold">Delivery information</h2>

            <div className="grid gap-5 sm:grid-cols-2">
              {fields.map((field) => (
                <div
                  key={field.name}
                  className={field.wide ? "sm:col-span-2" : ""}
                >
                  <label
                    htmlFor={field.name}
                    className="mb-2 block text-sm font-medium text-neutral-800"
                  >
                    {field.label}
                  </label>

                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type ?? "text"}
                    value={form[field.name]}
                    onChange={(event) =>
                      updateField(field.name, event.target.value)
                    }
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    aria-invalid={Boolean(errors[field.name])}
                    aria-describedby={
                      errors[field.name] ? `${field.name}-error` : undefined
                    }
                    className={`w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-orange-100 ${
                      errors[field.name]
                        ? "border-red-500"
                        : "border-neutral-300 focus:border-orange-500"
                    }`}
                  />

                  {errors[field.name] && (
                    <p
                      id={`${field.name}-error`}
                      className="mt-1 text-sm text-red-600"
                    >
                      {errors[field.name]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-orange-50 p-4 text-sm text-neutral-700">
              Payment is not enabled yet. This step only validates delivery
              information in your browser.
            </div>


            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-neutral-950 px-6 py-4 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Placing order..." : "Place order"}
            </button>


            {orderMessage && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
              >
                {orderMessage}
              </p>
            )}
          </form>

          <aside className="h-fit rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="text-xl font-bold">Order summary</h2>

            <div className="mt-5 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="mt-1 text-neutral-500">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3 border-t border-neutral-200 pt-5">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Shipping</span>
                <span>Calculated later</span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-4 font-bold">
                <span>Current total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            </div>

            <p className="mt-5 flex items-center gap-2 text-xs text-neutral-500">
              <LockKeyhole size={16} />
              Secure payment integration will be added later.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
