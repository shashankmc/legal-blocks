/**
 * The BlueLab compliance service, which runs as its own container.
 *
 * One catch-all route serves the whole named-operation API: GET operations
 * (cases, methods, corpus, document, markdown, ground-truth) and POST
 * operations (search, selection/save, annotation/export, annotation/import,
 * graph), including nested names like annotation/export.
 *
 * The operation is checked against a fixed set rather than forwarded — the
 * browser names an operation, not a URL, the same rule the agreement service
 * route keeps.
 */
const OPERATIONS = new Set([
  "config",
  "cases",
  "case",
  "methods",
  "search",
  "corpus",
  "document",
  "markdown",
  "ground-truth",
  "selection/save",
  "annotation/export",
  "annotation/import",
  "graph",
]);

export default defineEventHandler(async (event) => {
  const operation = (getRouterParam(event, "operation") ?? "").replace(/^\/+|\/+$/g, "");
  if (!OPERATIONS.has(operation)) {
    throw fail(event, 404, `the bluelab service has no operation "${operation}"`);
  }

  // From the environment at request time: the compose file sets this.
  const base = process.env["LEGAL_BLOCKS_BLUELAB_URL"];
  if (!base) {
    throw fail(
      event,
      503,
      "the bluelab service is not running. It is a separate container — check " +
        "that it started alongside the platform.",
    );
  }

  const method = getMethod(event);
  const query = new URLSearchParams(getQuery(event) as Record<string, string>).toString();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  // The service gates ground truth on the admin role; pass the caller's along.
  const role = getHeader(event, "x-bluelab-role");
  if (role) headers["X-BlueLab-Role"] = role;

  const init: RequestInit = { method, headers };
  if (method !== "GET" && method !== "HEAD") {
    init.body = JSON.stringify(await readBody(event));
  }

  const upstream = await fetch(
    `${base.replace(/\/+$/, "")}/api/${operation}${query ? `?${query}` : ""}`,
    init,
  );
  if (!upstream.ok) {
    throw fail(event, upstream.status, `the bluelab service failed: ${await upstream.text()}`);
  }
  setResponseHeader(
    event,
    "content-type",
    upstream.headers.get("content-type") ?? "application/json",
  );
  return upstream.body;
});
