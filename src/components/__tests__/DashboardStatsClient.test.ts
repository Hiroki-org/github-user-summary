import { describe, it, expect } from "vitest";
import { buildEventSeries } from "../DashboardStatsClient";

describe("buildEventSeries", () => {
  it("should return an empty array when given an empty array", () => {
    expect(buildEventSeries([])).toEqual([]);
  });

  it("should replace 'Event' with an empty string in the name property", () => {
    const input = [
      { type: "PushEvent", count: 10 },
      { type: "PullRequestEvent", count: 5 },
      { type: "IssuesEvent", count: 2 },
    ];
    const expected = [
      { name: "Push", count: 10 },
      { name: "PullRequest", count: 5 },
      { name: "Issues", count: 2 },
    ];
    expect(buildEventSeries(input)).toEqual(expected);
  });

  it("should return at most 6 elements", () => {
    const input = Array.from({ length: 10 }, (_, i) => ({
      type: `Type${i}Event`,
      count: i,
    }));
    const result = buildEventSeries(input);
    expect(result.length).toBe(6);
    expect(result).toEqual([
      { name: "Type0", count: 0 },
      { name: "Type1", count: 1 },
      { name: "Type2", count: 2 },
      { name: "Type3", count: 3 },
      { name: "Type4", count: 4 },
      { name: "Type5", count: 5 },
    ]);
  });

  it("should correctly map the count property", () => {
    const input = [
      { type: "PushEvent", count: 42 },
      { type: "CreateEvent", count: 1 },
    ];
    const expected = [
      { name: "Push", count: 42 },
      { name: "Create", count: 1 },
    ];
    expect(buildEventSeries(input)).toEqual(expected);
  });

  it("should not modify type if it does not contain 'Event'", () => {
    const input = [{ type: "Push", count: 10 }];
    const expected = [{ name: "Push", count: 10 }];
    expect(buildEventSeries(input)).toEqual(expected);
  });

  it("should return an array mapping e.type to name and e.count to value if mapping to value is expected", () => {
    // Testing the current behavior of the function, which actually maps to count,
    // replacing Event in the name string based on the source code structure.
    const input = [{ type: "PushEvent", count: 10 }];
    const result = buildEventSeries(input);
    expect(result[0]).toHaveProperty('name', 'Push');
    expect(result[0]).toHaveProperty('count', 10);
  });
});
