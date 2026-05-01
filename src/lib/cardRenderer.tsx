import { ImageResponse } from "@vercel/og";
import type { ReactElement } from "react";
import satori from "satori";

import type { CardData } from "@/lib/cardDataFetcher";
import type { CardRenderOptions } from "./cardOptions";
import { resolveBlockLayout } from "./cardOptions";
import { cardTree, errorTree, estimateHeight } from "./cardElements";
import { isTrustedFontUrl } from "@/lib/validators";

export * from "./cardOptions";

const DEFAULT_FONT_URL =
  "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Regular.ttf";
const FONT_FETCH_TIMEOUT_MS = 5000;

const fontCache = new Map<string, Promise<ArrayBuffer>>();

function getFontData(fontUrl?: string, allowedOrigin?: string): Promise<ArrayBuffer> {
  const targetUrl =
    fontUrl && isTrustedFontUrl(fontUrl, allowedOrigin)
      ? fontUrl
      : DEFAULT_FONT_URL;

  if (!fontCache.has(targetUrl)) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FONT_FETCH_TIMEOUT_MS);

    const pending = fetch(targetUrl, {
      cache: "force-cache",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load default font");
        }
        return response.arrayBuffer();
      })
      .catch((error) => {
        fontCache.delete(targetUrl);
        throw error;
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    fontCache.set(targetUrl, pending);
  }

  return fontCache.get(targetUrl)!;
}

async function renderSvg(
  element: ReactElement,
  width: number,
  height: number,
  fontUrl?: string,
  allowedOrigin?: string,
): Promise<string> {
  const fontData = await getFontData(fontUrl, allowedOrigin);
  return satori(element, {
    width,
    height,
    fonts: [
      {
        name: "Noto Sans",
        data: fontData,
        weight: 400,
        style: "normal",
      },
    ],
  });
}

export async function renderCardResponse(args: {
  data: CardData;
  options: CardRenderOptions;
  cacheControl: string;
  fontUrl?: string;
  allowedOrigin?: string;
}): Promise<Response> {
  const layout = resolveBlockLayout(args.options);
  const height = estimateHeight(args.options, layout);
  const element = cardTree(args.data, args.options, height);

  if (args.options.format === "svg") {
    const svg = await renderSvg(
      element,
      args.options.width,
      height,
      args.fontUrl,
      args.allowedOrigin,
    );
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": args.cacheControl,
      },
    });
  }

  return new ImageResponse(element, {
    width: args.options.width,
    height,
    headers: {
      "Cache-Control": args.cacheControl,
    },
  });
}

export async function renderErrorCardResponse(args: {
  message: string;
  options: CardRenderOptions;
  status: number;
  cacheControl: string;
  fontUrl?: string;
  allowedOrigin?: string;
}): Promise<Response> {
  const height = 260;
  const element = errorTree(args.message, args.options, height);

  if (args.options.format === "svg") {
    const svg = await renderSvg(
      element,
      args.options.width,
      height,
      args.fontUrl,
      args.allowedOrigin,
    );
    return new Response(svg, {
      status: args.status,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": args.cacheControl,
      },
    });
  }

  return new ImageResponse(element, {
    width: args.options.width,
    height,
    status: args.status,
    headers: {
      "Cache-Control": args.cacheControl,
    },
  });
}
