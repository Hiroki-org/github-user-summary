import { RateLimiter } from "@/lib/rateLimit";
import { fetchCardData } from "@/lib/cardDataFetcher";
import { parseCardQueryParams, renderCardResponse, renderErrorCardResponse } from "@/lib/cardRenderer";
import { getClientIp } from "@/lib/rateLimit";

export const runtime = "edge";
const rateLimiter = new RateLimiter(50, 60 * 1000); // 50 requests per minute


const SUCCESS_CACHE = "public, s-maxage=1800, stale-while-revalidate=3600";
const ERROR_CACHE = "public, s-maxage=60, stale-while-revalidate=120";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ username: string }> }
): Promise<Response> {
    const { username } = await params;
    const url = new URL(request.url);
    const options = parseCardQueryParams(url.searchParams);
    let allowedOrigin = process.env.APP_URL;
    if (!allowedOrigin) {
        if (process.env.NODE_ENV === "production") {
            return renderErrorCardResponse({
                message: "Server configuration error",
                options,
                status: 500,
                cacheControl: ERROR_CACHE,
            });
        }
        allowedOrigin = "http://localhost:3000";
    }
    const fontUrl = `${allowedOrigin}/fonts/NotoSans-Regular.ttf`;

    const ip = getClientIp(request);
    const rateLimitResult = await rateLimiter.check(ip);

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
                allowedOrigin,
            });
        }

        return renderCardResponse({
            data,
            options,
            cacheControl: SUCCESS_CACHE,
            fontUrl,
            allowedOrigin,
        });
    } catch {
        return renderErrorCardResponse({
            message: "Temporarily unavailable",
            options,
            status: 503,
            cacheControl: ERROR_CACHE,
            fontUrl,
            allowedOrigin,
        });
    }
}
