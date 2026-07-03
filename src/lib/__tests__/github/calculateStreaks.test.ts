import { describe, it, expect } from "vitest";
import { calculateStreaks } from "../../github";

describe("calculateStreaks", () => {
  it("returns 0 for empty calendar", () => {
    expect(calculateStreaks([])).toEqual({ longestStreak: 0, currentStreak: 0 });
  });

  it("calculates streak ending on the last day", () => {
    const calendar = [
      { count: 1 },
      { count: 1 },
      { count: 1 },
    ];
    expect(calculateStreaks(calendar)).toEqual({ longestStreak: 3, currentStreak: 3 });
  });

  it("calculates streak ending with 0 on the last day", () => {
    const calendar = [
      { count: 1 },
      { count: 1 },
      { count: 0 },
    ];
    expect(calculateStreaks(calendar)).toEqual({ longestStreak: 2, currentStreak: 2 });
  });

  it("resets streak if 0 appears before the last day", () => {
    const calendar = [
      { count: 1 },
      { count: 0 },
      { count: 1 },
    ];
    expect(calculateStreaks(calendar)).toEqual({ longestStreak: 1, currentStreak: 1 });
  });

  it("calculates correctly when there are multiple zeros", () => {
    const calendar = [
      { count: 1 },
      { count: 0 },
      { count: 0 },
    ];
    expect(calculateStreaks(calendar)).toEqual({ longestStreak: 1, currentStreak: 0 });
  });

  it("calculates longest streak correctly", () => {
    const calendar = [
      { count: 0 },
      { count: 1 },
      { count: 1 },
      { count: 1 },
      { count: 0 },
      { count: 1 },
    ];
    expect(calculateStreaks(calendar)).toEqual({ longestStreak: 3, currentStreak: 1 });
  });

  it("calculates longest streak correctly with 0 at the end", () => {
    const calendar = [
      { count: 0 },
      { count: 1 },
      { count: 1 },
      { count: 1 },
      { count: 0 },
      { count: 1 },
      { count: 1 },
      { count: 0 },
    ];
    expect(calculateStreaks(calendar)).toEqual({ longestStreak: 3, currentStreak: 2 });
  });
});
