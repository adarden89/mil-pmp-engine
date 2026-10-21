"use client";

import { LoaderCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { usePurchase } from "@/components/providers/use-purchase";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { isProductId } from "@/lib/catalog";
import { decodeCartParam } from "@/lib/cart-param";

/** Resumes a checkout after sign-in: /checkout/start?products=base_tool,exam_vault */
export function CheckoutStart() {
  const params = useSearchParams();
  const purchase = usePurchase();
  const started = useRef(false);
  const products = decodeCartParam(params.get("products")).filter(isProductId);
  const { checkout } = purchase;
  const cartKey = products.join(",");

  useEffect(() => {
    if (started.current || cartKey === "") return;
    started.current = true;
    void checkout(cartKey.split(",").filter(isProductId));
  }, [cartKey, checkout]);

  if (products.length === 0 || purchase.error) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <p className="font-semibold">We couldn&apos;t start checkout</p>
        <p className="mt-2 text-sm text-muted">{purchase.error ?? "No products were selected."}</p>
        <LinkButton href="/#pricing" className="mt-6">
          Back to pricing
        </LinkButton>
      </Card>
    );
  }

  return (
    <Card className="mx-auto flex max-w-md flex-col items-center p-10 text-center">
      <LoaderCircle className="size-8 animate-spin text-brand" aria-hidden />
      <p className="mt-4 font-semibold">Opening secure checkout…</p>
      <p className="mt-1 text-sm text-muted">You&apos;ll be redirected to Stripe.</p>
    </Card>
  );
}
