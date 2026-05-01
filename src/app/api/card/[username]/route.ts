import { RateLimiter } from "@/lib/rateLimit";
import { fetchCardData } from "@/lib/cardDataFetcher";
import { parseCardQueryParams, renderCardResponse, renderErrorCardResponse } from "@/lib/cardRenderer";

export const runtime = "edge";
const rateLimiter = new RateLimiter(50, 60 * 1000); // 50 requests per minute


const SUCCESS_CACHE = "public, s-maxage=1800, stale-while-revalidate=3600";
const ERROR_CACHE = "public, s-maxage=60, stale-while-revalidate=120";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ username: string }> }
): Promise<Response> {
    const { username } = await params;
    const options = parseCardQueryParams(new URL(request.url).searchParams);
    const fontUrl = `${new URL(request.url).origin}/fonts/NotoSans-Regular.ttf`;

    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rateLimitResult = rateLimiter.check(ip);

    if (!rateLimitResult.success) {
        return renderErrorCardResponse({
            message: "Rate limit exceeded",
            options,
            status: 429,
            cacheControl: ERROR_CACHE,
            fontUrl,
        });
    }


    try {
        const data = await fetchCardData(username);

        if (!data) {
            return renderErrorCardResponse({
                message: "User not found",
                options,
                status: 404,
                cacheControl: ERROR_CACHE,
                fontUrl,
            });
        }

        return renderCardResponse({
            data,
            options,
            cacheControl: SUCCESS_CACHE,
            fontUrl,
        });
    } catch {
        return renderErrorCardResponse({
            message: "Temporarily unavailable",
            options,
            status: 503,
            cacheControl: ERROR_CACHE,
            fontUrl,
        });
    }
}
