// Tracing (plan 0.7): spans for routes, Server Actions and outgoing fetch; `traceparent` is propagated to
// ECL-Server so one trace covers browser → Next → FastAPI → Celery. Enabled only when an OTLP endpoint is set.
export async function register() {
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) return;
  const { registerOTel } = await import("@vercel/otel");
  registerOTel({ serviceName: "ledgerline-web", instrumentationConfig: { fetch: { propagateContextUrls: [process.env.ENGINE_URL ?? "http://localhost:8000"] } } });
}
