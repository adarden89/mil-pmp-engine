import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutSuccess } from "@/components/checkout/checkout-success";

export const metadata: Metadata = { title: "Payment confirmed", robots: { index: false } };

export default function CheckoutSuccessPage() {
  return (
    <div className="px-4 py-24">
      <Suspense fallback={null}>
        <CheckoutSuccess />
      </Suspense>
    </div>
  );
}
