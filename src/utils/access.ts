export function shouldAttemptProxyRedeem(options?: {
  env?: Partial<Record<string, string | boolean | undefined>>;
}) {
  const env = options?.env ?? import.meta.env;
  const proxyUrl = env.VITE_REDEEM_PROXY_URL;
  const isDev = Boolean(env.DEV);

  if (typeof proxyUrl === "string" && proxyUrl.trim()) {
    return !isDev;
  }

  return false;
}
