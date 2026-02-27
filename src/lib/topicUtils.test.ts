import { describe, it, expect } from "vitest";
import { getTopicSizeClass } from "./topicUtils";

describe("getTopicSizeClass", () => {
  it("should return 'text-xs' when maxCount is less than or equal to 0", () => {
    expect(getTopicSizeClass(10, 0)).toBe("text-xs");
    expect(getTopicSizeClass(10, -5)).toBe("text-xs");
  });

  it("should return 'text-base font-semibold' when ratio is greater than or equal to 0.8", () => {
    expect(getTopicSizeClass(8, 10)).toBe("text-base font-semibold"); // 0.8
    expect(getTopicSizeClass(10, 10)).toBe("text-base font-semibold"); // 1.0
    expect(getTopicSizeClass(9, 10)).toBe("text-base font-semibold"); // 0.9
  });

  it("should return 'text-sm font-medium' when ratio is between 0.5 (inclusive) and 0.8 (exclusive)", () => {
    expect(getTopicSizeClass(5, 10)).toBe("text-sm font-medium"); // 0.5
    expect(getTopicSizeClass(6, 10)).toBe("text-sm font-medium"); // 0.6
    expect(getTopicSizeClass(7.9, 10)).toBe("text-sm font-medium"); // 0.79
  });

  it("should return 'text-xs' when ratio is less than 0.5", () => {
    expect(getTopicSizeClass(4, 10)).toBe("text-xs"); // 0.4
    expect(getTopicSizeClass(0, 10)).toBe("text-xs"); // 0.0
    expect(getTopicSizeClass(1, 10)).toBe("text-xs"); // 0.1
  });

  it("should handle edge cases where count is 0", () => {
      expect(getTopicSizeClass(0, 100)).toBe("text-xs");
  });
});
