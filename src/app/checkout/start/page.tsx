import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutStart } from "@/components/checkout/checkout-start";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutStartPage() {
  return (
    <div className="px-4 py-24">
      <Suspense fallback={null}>
        <CheckoutStart />
      </Suspense>
    </div>
  );
}
