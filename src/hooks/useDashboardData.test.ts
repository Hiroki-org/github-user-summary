import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDashboardData, useYearInReview, useDashboardStats } from './useDashboardData';
import * as nextAuthReact from 'next-auth/react';
import * as swr from 'swr';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

vi.mock('swr', () => ({
  default: vi.fn(),
}));

describe('useDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not fetch when unauthenticated', () => {
    vi.mocked(nextAuthReact.useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as unknown as ReturnType<typeof nextAuthReact.useSession>);

    vi.mocked(swr.default).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useDashboardData());

    expect(swr.default).toHaveBeenCalledWith(null, expect.any(Function));
    expect(result.current.isLoading).toBe(false);
  });

  it('should not fetch when loading', () => {
    vi.mocked(nextAuthReact.useSession).mockReturnValue({
      data: null,
      status: 'loading',
    } as unknown as ReturnType<typeof nextAuthReact.useSession>);

    vi.mocked(swr.default).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useDashboardData());

    expect(swr.default).toHaveBeenCalledWith(null, expect.any(Function));
    expect(result.current.isLoading).toBe(true);
  });

  it('should fetch when authenticated with token', () => {
    vi.mocked(nextAuthReact.useSession).mockReturnValue({
      data: { accessToken: 'token123' },
      status: 'authenticated',
    } as unknown as ReturnType<typeof nextAuthReact.useSession>);

    const mockData = {
      username: 'testuser',
      summary: { totalStars: 10 }
    };

    vi.mocked(swr.default).mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useDashboardData());

    expect(swr.default).toHaveBeenCalledWith('/api/dashboard/summary', expect.any(Function));
    expect(result.current.username).toBe('testuser');
    expect(result.current.summary).toEqual({ totalStars: 10 });
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle error from swr', () => {
    vi.mocked(nextAuthReact.useSession).mockReturnValue({
      data: { accessToken: 'token123' },
      status: 'authenticated',
    } as unknown as ReturnType<typeof nextAuthReact.useSession>);

    const error = new Error('Failed to fetch');
    vi.mocked(swr.default).mockReturnValue({
      data: undefined,
      error,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useDashboardData());

    expect(result.current.error).toBe(error);
  });
});

describe('useYearInReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not fetch when unauthenticated', () => {
    vi.mocked(nextAuthReact.useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as unknown as ReturnType<typeof nextAuthReact.useSession>);

    vi.mocked(swr.default).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useYearInReview(2023));

    expect(swr.default).toHaveBeenCalledWith(null, expect.any(Function));
    expect(result.current.isLoading).toBe(false);
  });

  it('should not fetch when year is null', () => {
    vi.mocked(nextAuthReact.useSession).mockReturnValue({
      data: { accessToken: 'token123' },
      status: 'authenticated',
    } as unknown as ReturnType<typeof nextAuthReact.useSession>);

    vi.mocked(swr.default).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    });

    renderHook(() => useYearInReview(null));

    expect(swr.default).toHaveBeenCalledWith(null, expect.any(Function));
  });

  it('should fetch when authenticated with token and valid year', () => {
    vi.mocked(nextAuthReact.useSession).mockReturnValue({
      data: { accessToken: 'token123' },
      status: 'authenticated',
    } as unknown as ReturnType<typeof nextAuthReact.useSession>);

    const mockData = { totalContributions: 100 };

    vi.mocked(swr.default).mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useYearInReview(2023));

    expect(swr.default).toHaveBeenCalledWith('/api/dashboard/year?year=2023', expect.any(Function));
    expect(result.current.data).toEqual(mockData);
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not fetch when unauthenticated', () => {
    vi.mocked(nextAuthReact.useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as unknown as ReturnType<typeof nextAuthReact.useSession>);

    vi.mocked(swr.default).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useDashboardStats(2023));

    expect(swr.default).toHaveBeenCalledWith(null, expect.any(Function));
    expect(result.current.isLoading).toBe(false);
  });

  it('should not fetch when year is null', () => {
    vi.mocked(nextAuthReact.useSession).mockReturnValue({
      data: { accessToken: 'token123' },
      status: 'authenticated',
    } as unknown as ReturnType<typeof nextAuthReact.useSession>);

    vi.mocked(swr.default).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    });

    renderHook(() => useDashboardStats(null));

    expect(swr.default).toHaveBeenCalledWith(null, expect.any(Function));
  });

  it('should fetch when authenticated with token and valid year', () => {
    vi.mocked(nextAuthReact.useSession).mockReturnValue({
      data: { accessToken: 'token123' },
      status: 'authenticated',
    } as unknown as ReturnType<typeof nextAuthReact.useSession>);

    const mockData = { year: 2023, heatmap: [[1, 2]] };

    vi.mocked(swr.default).mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useDashboardStats(2023));

    expect(swr.default).toHaveBeenCalledWith('/api/dashboard/stats?year=2023', expect.any(Function));
    expect(result.current.year).toBe(2023);
    expect(result.current.heatmap).toEqual([[1, 2]]);
    expect(result.current.isLoading).toBe(false);
  });
});

describe('fetcher', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should fetch data successfully', async () => {
    // We need to extract fetcher from the module, since it's not exported
    // The easiest way is to mock useSWR implementation and trigger the fetcher

    vi.mocked(nextAuthReact.useSession).mockReturnValue({
      data: { accessToken: 'token123' },
      status: 'authenticated',
    } as unknown as ReturnType<typeof nextAuthReact.useSession>);

    let capturedFetcher: Parameters<typeof swr.default>[1];
    vi.mocked(swr.default).mockImplementation((url, fetcher) => {
      capturedFetcher = fetcher;
      return {
        data: undefined,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: vi.fn(),
      } as unknown as ReturnType<typeof nextAuthReact.useSession>
    });

    renderHook(() => useDashboardData());

    expect(capturedFetcher).toBeDefined();

    const mockResponse = { data: 'test data' };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await capturedFetcher('/test-url');
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith('/test-url');
  });

  it('should handle fetch error with text body', async () => {
    vi.mocked(nextAuthReact.useSession).mockReturnValue({
      data: { accessToken: 'token123' },
      status: 'authenticated',
    } as unknown as ReturnType<typeof nextAuthReact.useSession>);

    let capturedFetcher: Parameters<typeof swr.default>[1];
    vi.mocked(swr.default).mockImplementation((url, fetcher) => {
      capturedFetcher = fetcher;
      return {
        data: undefined,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: vi.fn(),
      } as unknown as ReturnType<typeof nextAuthReact.useSession>
    });

    renderHook(() => useDashboardData());

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
    });

    await expect(capturedFetcher('/test-url')).rejects.toThrow('Not Found');
  });

  it('should handle fetch error without text body', async () => {
    vi.mocked(nextAuthReact.useSession).mockReturnValue({
      data: { accessToken: 'token123' },
      status: 'authenticated',
    } as unknown as ReturnType<typeof nextAuthReact.useSession>);

    let capturedFetcher: Parameters<typeof swr.default>[1];
    vi.mocked(swr.default).mockImplementation((url, fetcher) => {
      capturedFetcher = fetcher;
      return {
        data: undefined,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: vi.fn(),
      } as unknown as ReturnType<typeof nextAuthReact.useSession>
    });

    renderHook(() => useDashboardData());

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => { throw new Error('Cannot read body') },
    });

    await expect(capturedFetcher('/test-url')).rejects.toThrow('Unknown error');
  });
});

  describe('fetcher extended', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should handle fetch error without text body and with status code', async () => {
    vi.mocked(nextAuthReact.useSession).mockReturnValue({
      data: { accessToken: 'token123' },
      status: 'authenticated',
    } as unknown as ReturnType<typeof nextAuthReact.useSession>);

    let capturedFetcher: Parameters<typeof swr.default>[1];
    vi.mocked(swr.default).mockImplementation((url, fetcher) => {
      capturedFetcher = fetcher;
      return {
        data: undefined,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: vi.fn(),
      } as unknown as ReturnType<typeof nextAuthReact.useSession>
    });

    renderHook(() => useDashboardData());

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => '',
    });

    await expect(capturedFetcher('/test-url')).rejects.toThrow('Request failed (500)');
  });
});
