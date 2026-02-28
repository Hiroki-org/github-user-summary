import { fetchCardData } from "@/lib/cardDataFetcher";
import { parseCardQueryParams, renderCardResponse, renderErrorCardResponse } from "@/lib/cardRenderer";
import { GitHubApiError } from "@/lib/types";

export const runtime = "edge";

const SUCCESS_CACHE = "public, s-maxage=1800, stale-while-revalidate=3600";
const ERROR_CACHE = "public, s-maxage=60, stale-while-revalidate=120";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
): Promise<Response> {
  const { username } = await params;
  const options = parseCardQueryParams(new URL(request.url).searchParams);

  try {
    const data = await fetchCardData(username);

    if (!data) {
      return renderErrorCardResponse({
        message: "User not found",
        options,
        status: 404,
        cacheControl: ERROR_CACHE,
      });
    }

    return renderCardResponse({
      data,
      options,
      cacheControl: SUCCESS_CACHE,
    });
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return renderErrorCardResponse({
        message: "Temporarily unavailable",
        options,
        status: 503,
        cacheControl: ERROR_CACHE,
      });
    }

    return renderErrorCardResponse({
      message: "Temporarily unavailable",
      options,
      status: 503,
      cacheControl: ERROR_CACHE,
    });
  }
}
