/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom";

import DashboardYearClient from "../DashboardYearClient";
import { useSearchParams } from "next/navigation";
import { useYearInReview } from "@/hooks/useDashboardData";

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
}));

vi.mock("@/hooks/useDashboardData", () => ({
  useYearInReview: vi.fn(),
}));

vi.mock("@/components/YearInReviewCarousel", () => ({
  default: vi.fn(({ data }) => (
    <div data-testid="mock-carousel">Carousel for {data.year}</div>
  )),
}));

describe("DashboardYearClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2024-06-15T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders loading state", () => {
    vi.mocked(useSearchParams).mockReturnValue({ mutate: vi.fn(),
      get: () => null,
    } as unknown as ReturnType<typeof useSearchParams>);

    vi.mocked(useYearInReview).mockReturnValue({ mutate: vi.fn(),
      isLoading: true,
      data: undefined,
      error: undefined,
    } as unknown as ReturnType<typeof useYearInReview>);

    render(<DashboardYearClient />);

    expect(screen.getByText("Loading year in review...")).toBeInTheDocument();
  });

  it("renders error state when error is present", () => {
    vi.mocked(useSearchParams).mockReturnValue({ mutate: vi.fn(),
      get: () => null,
    } as unknown as ReturnType<typeof useSearchParams>);

    vi.mocked(useYearInReview).mockReturnValue({ mutate: vi.fn(),
      isLoading: false,
      data: undefined,
      error: new Error("Test error"),
    } as unknown as ReturnType<typeof useYearInReview>);

    render(<DashboardYearClient />);

    expect(screen.getByText("Failed to load year in review.")).toBeInTheDocument();
  });

  it("renders error state when no data is present", () => {
    vi.mocked(useSearchParams).mockReturnValue({ mutate: vi.fn(),
      get: () => null,
    } as unknown as ReturnType<typeof useSearchParams>);

    vi.mocked(useYearInReview).mockReturnValue({ mutate: vi.fn(),
      isLoading: false,
      data: undefined,
      error: undefined,
    } as unknown as ReturnType<typeof useYearInReview>);

    render(<DashboardYearClient />);

    expect(screen.getByText("Failed to load year in review.")).toBeInTheDocument();
  });

  it("uses the current year when no query param is provided", () => {
    vi.mocked(useSearchParams).mockReturnValue({ mutate: vi.fn(),
      get: () => null,
    } as unknown as ReturnType<typeof useSearchParams>);

    vi.mocked(useYearInReview).mockReturnValue({ mutate: vi.fn(),
      isLoading: false,
      data: { year: 2024 } as unknown as import("@/lib/types").YearInReviewData,
      error: undefined,
    });

    render(<DashboardYearClient />);

    expect(useYearInReview).toHaveBeenCalledWith(2024);
    expect(screen.getByText("Year in Review 2024")).toBeInTheDocument();
    expect(screen.getByTestId("mock-carousel")).toHaveTextContent("Carousel for 2024");
  });

  it("uses the provided year when it is valid", () => {
    vi.mocked(useSearchParams).mockReturnValue({ mutate: vi.fn(),
      get: (key: string) => (key === "year" ? "2023" : null),
    } as unknown as ReturnType<typeof useSearchParams>);

    vi.mocked(useYearInReview).mockReturnValue({ mutate: vi.fn(),
      isLoading: false,
      data: { year: 2023 } as unknown as import("@/lib/types").YearInReviewData,
      error: undefined,
    });

    render(<DashboardYearClient />);

    expect(useYearInReview).toHaveBeenCalledWith(2023);
    expect(screen.getByText("Year in Review 2023")).toBeInTheDocument();
    expect(screen.getByTestId("mock-carousel")).toHaveTextContent("Carousel for 2023");
  });

  it("falls back to the current year when the year query param is invalid", () => {
    vi.mocked(useSearchParams).mockReturnValue({ mutate: vi.fn(),
      get: (key: string) => (key === "year" ? "invalid" : null),
    } as unknown as ReturnType<typeof useSearchParams>);

    vi.mocked(useYearInReview).mockReturnValue({ mutate: vi.fn(),
      isLoading: false,
      data: { year: 2024 } as unknown as import("@/lib/types").YearInReviewData,
      error: undefined,
    });

    render(<DashboardYearClient />);

    expect(useYearInReview).toHaveBeenCalledWith(2024);
    expect(screen.getByText("Year in Review 2024")).toBeInTheDocument();
  });

  it("bounds the requested year to 2008 minimum", () => {
    vi.mocked(useSearchParams).mockReturnValue({ mutate: vi.fn(),
      get: (key: string) => (key === "year" ? "1999" : null),
    } as unknown as ReturnType<typeof useSearchParams>);

    vi.mocked(useYearInReview).mockReturnValue({ mutate: vi.fn(),
      isLoading: false,
      data: { year: 2008 } as unknown as import("@/lib/types").YearInReviewData,
      error: undefined,
    });

    render(<DashboardYearClient />);

    expect(useYearInReview).toHaveBeenCalledWith(2008);
  });

  it("bounds the requested year to current year maximum", () => {
    vi.mocked(useSearchParams).mockReturnValue({ mutate: vi.fn(),
      get: (key: string) => (key === "year" ? "3000" : null),
    } as unknown as ReturnType<typeof useSearchParams>);

    vi.mocked(useYearInReview).mockReturnValue({ mutate: vi.fn(),
      isLoading: false,
      data: { year: 2024 } as unknown as import("@/lib/types").YearInReviewData,
      error: undefined,
    });

    render(<DashboardYearClient />);

    expect(useYearInReview).toHaveBeenCalledWith(2024);
  });
});
