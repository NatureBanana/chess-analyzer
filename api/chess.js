export const config = { runtime: "edge" };

const ALLOWED_HOST = "api.chess.com";
const ALLOWED_PREFIX = "/pub/";

function forbidden(msg, status = 403) {
  return new Response(msg, { status });
}

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");
  if (!target) return forbidden("Missing url parameter", 400);

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch {
    return forbidden("Invalid url", 400);
  }

  if (
    targetUrl.protocol !== "https:" ||
    targetUrl.hostname !== ALLOWED_HOST ||
    !targetUrl.pathname.startsWith(ALLOWED_PREFIX)
  ) {
    return forbidden("Forbidden host or path");
  }

  try {
    const upstream = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: { "User-Agent": "ChessAnalyzer/1.0 (https://github.com/chess-analyzer)" },
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "application/json",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return forbidden("Upstream fetch failed", 502);
  }
}
