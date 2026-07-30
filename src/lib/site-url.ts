function asHttpsUrl(host: string) {
  return host.startsWith("http://") || host.startsWith("https://")
    ? host
    : `https://${host}`;
}

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelHost) return asHttpsUrl(vercelHost).replace(/\/$/, "");

  return "http://localhost:3000";
}
