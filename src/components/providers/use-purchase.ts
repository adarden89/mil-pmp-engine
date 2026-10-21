"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { CheckoutResponse } from "@/app/api/checkout/route";
import type { UpsellResponse } from "@/app/api/upsell/route";
import { apiFetch, loginHref } from "@/lib/api-client";
import { PRODUCTS, type ProductId } from "@/lib/catalog";
import { useSession } from "./session-provider";

export interface PurchaseState {
  pending: ProductId | "cart" | null;
  error: string | null;
  notice: string | null;
}

/**
 * Client purchase flows:
 * - checkout(): hosted Stripe Checkout for a cart (base tool + optional add-ons).
 * - oneClick(): charges the saved card for an add-on with no redirect, falling
 *   back to Checkout when the bank needs the cardholder to authenticate.
 */
export function usePurchase() {
  const router = useRouter();
  const session = useSession();
  const [state, setState] = useState<PurchaseState>({ pending: null, error: null, notice: null });

  const checkout = useCallback(
    async (productIds: ProductId[]) => {
      setState({ pending: "cart", error: null, notice: null });
      const result = await apiFetch<CheckoutResponse>("/api/checkout", {
        method: "POST",
        body: JSON.stringify({ productIds }),
      });
      if (result.ok) {
        window.location.assign(result.data.url);
        return;
      }
      if (result.status === 401) {
        router.push(loginHref(`/checkout/start?products=${productIds.join(",")}`));
        return;
      }
      setState({ pending: null, error: result.message, notice: null });
    },
    [router],
  );

  const oneClick = useCallback(
    async (productId: ProductId) => {
      setState({ pending: productId, error: null, notice: null });
      const result = await apiFetch<UpsellResponse>("/api/upsell", {
        method: "POST",
        body: JSON.stringify({ productId }),
      });
      if (!result.ok) {
        if (result.status === 401) {
          router.push(loginHref("/dashboard"));
          return;
        }
        if (result.code === "base_required") {
          router.push("/#pricing");
          return;
        }
        setState({ pending: null, error: result.message, notice: null });
        return;
      }

      const outcome = result.data;
      if (outcome.status === "redirect") {
        window.location.assign(outcome.url);
        return;
      }
      await session.refresh();
      if (outcome.status === "unlocked") {
        setState({ pending: null, error: null, notice: `${PRODUCTS[productId].name} unlocked.` });
        router.push(outcome.redirectTo);
        return;
      }
      setState({
        pending: null,
        error: null,
        notice: "Payment is processing. Your add-on unlocks automatically when your bank confirms it.",
      });
    },
    [router, session],
  );

  return { ...state, checkout, oneClick };
}
