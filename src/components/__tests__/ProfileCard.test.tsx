// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProfileCard from "../ProfileCard";
import type { UserProfile } from "@/lib/types";

const mockProfile: UserProfile = {
  login: "octocat",
  avatar_url: "https://github.com/images/error/octocat_happy.gif",
  name: "The Octocat",
  bio: "I'm a GitHub mascot.",
  company: "@github",
  location: "San Francisco",
  blog: "https://github.blog",
  twitter_username: "github",
  created_at: "2011-01-25T18:44:36Z",
  followers: 1000,
  following: 50,
  public_repos: 100,
  orgs: [
    { login: "github", avatar_url: "https://avatars.githubusercontent.com/u/9919?v=4" }
  ],
  pinnedRepos: [
    {
      name: "Spoon-Knife",
      description: "This repo is for demonstration purposes only.",
      url: "https://github.com/octocat/Spoon-Knife",
      stargazerCount: 15000,
      primaryLanguage: { name: "HTML", color: "#e34c26" }
    }
  ]
};

describe("ProfileCard", () => {
  it("renders basic profile information correctly", () => {
    render(<ProfileCard profile={mockProfile} />);

    // Name and login
    expect(screen.getByText("The Octocat")).toBeInTheDocument();
    expect(screen.getByText("@octocat")).toBeInTheDocument();

    // Stats
    expect(screen.getByText(mockProfile.followers.toLocaleString())).toBeInTheDocument();
    expect(screen.getByText(mockProfile.following.toLocaleString())).toBeInTheDocument();
    expect(screen.getByText(mockProfile.public_repos.toLocaleString())).toBeInTheDocument();

    // Join date - "Joined January 2011"
    expect(screen.getByText(/Joined January 2011/)).toBeInTheDocument();
  });

  it("falls back to login when name is null", () => {
    const profileWithoutName = { ...mockProfile, name: null };
    render(<ProfileCard profile={profileWithoutName} />);

    expect(screen.getByRole("heading", { level: 2, name: "octocat" })).toBeInTheDocument();
    expect(screen.getByText("@octocat")).toBeInTheDocument();
  });

  it("renders optional fields when provided", () => {
    render(<ProfileCard profile={mockProfile} />);

    expect(screen.getByText("I'm a GitHub mascot.")).toBeInTheDocument();
    expect(screen.getByText("@github")).toBeInTheDocument();
    expect(screen.getByText("San Francisco")).toBeInTheDocument();
    expect(screen.getByText("github.blog")).toBeInTheDocument();
  });

  it("does not render optional fields when null", () => {
    const minimalProfile = {
      ...mockProfile,
      bio: null,
      company: null,
      location: null,
      blog: null,
      orgs: [],
      pinnedRepos: []
    };
    render(<ProfileCard profile={minimalProfile} />);

    expect(screen.queryByText("I'm a GitHub mascot.")).not.toBeInTheDocument();
    expect(screen.queryByText("@github")).not.toBeInTheDocument();
    expect(screen.queryByText("San Francisco")).not.toBeInTheDocument();
    expect(screen.queryByText("github.blog")).not.toBeInTheDocument();
    expect(screen.queryByText("Organizations")).not.toBeInTheDocument();
    expect(screen.queryByText("Pinned Repositories")).not.toBeInTheDocument();
  });

  it("renders organizations correctly", () => {
    render(<ProfileCard profile={mockProfile} />);
    screen.getByText("Organizations");
    screen.getByText("github");
  });

  it("renders pinned repositories correctly", () => {
    render(<ProfileCard profile={mockProfile} />);
    expect(screen.getByText("Pinned Repositories")).toBeInTheDocument();
    expect(screen.getByText("Spoon-Knife")).toBeInTheDocument();
    expect(screen.getByText("This repo is for demonstration purposes only.")).toBeInTheDocument();
    expect(screen.getByText("HTML")).toBeInTheDocument();
    expect(screen.getByText(mockProfile.pinnedRepos[0].stargazerCount.toLocaleString())).toBeInTheDocument();
  });

  it("handles pinned repos without description or language", () => {
    const profileWithMinimalRepo = {
      ...mockProfile,
      pinnedRepos: [
        {
          name: "Empty-Repo",
          description: null,
          url: "https://github.com/octocat/Empty-Repo",
          stargazerCount: 0,
          primaryLanguage: null
        }
      ]
    };
    render(<ProfileCard profile={profileWithMinimalRepo} />);

    expect(screen.getByText("Pinned Repositories")).toBeInTheDocument();
    expect(screen.getByText("Empty-Repo")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
