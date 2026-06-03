import { describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => {
    return {
        default: vi.fn().mockReturnValue("mock-handler")
    };
});

vi.mock("@/lib/auth", () => ({
    authOptions: { secret: "test-secret" }
}));

describe("API Auth Route", () => {
    it("should export GET and POST handlers from NextAuth", async () => {
        const { GET, POST } = await import("./route");
        const NextAuth = (await import("next-auth")).default;
        const { authOptions } = await import("@/lib/auth");

        expect(NextAuth).toHaveBeenCalledWith(authOptions);
        expect(GET).toBe("mock-handler");
        expect(POST).toBe("mock-handler");
    });
});
