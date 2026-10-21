import type { Instrumentation } from "next";
import { reportError } from "@/lib/monitoring";

/** Server errors from rendering, route handlers, server actions, and the proxy. */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  await reportError(error, {
    source: context.routeType,
    route: context.routePath,
    method: request.method,
    tags: { router: context.routerKind, ...(context.renderSource ? { renderSource: context.renderSource } : {}) },
  });
};
