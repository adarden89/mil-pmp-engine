/** Parse the ?products=a,b query value used to resume a checkout after sign-in. */
export function decodeCartParam(value: string | null): string[] {
  return [
    ...new Set(
      (value ?? "")
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ].slice(0, 5);
}
