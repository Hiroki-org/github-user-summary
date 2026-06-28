
import { render, screen } from "@testing-library/react";
import { BioBlock } from "../../BusinessCardBlocks/BioBlock";

describe("BioBlock", () => {
  const profile = {
    bio: "Test bio",
    company: "Test Company",
    location: "Test Location",
    blog: "https://example.com",
    twitter_username: "testtwitter",
    created_at: "2023-01-01T00:00:00Z",
  } as any;

  it("renders basic bio", () => {
    // testing undefined options
    render(<BioBlock profile={profile} options={undefined as any} />);
    expect(screen.getByText("Test bio")).toBeInTheDocument();
  });

  it("renders missing bio", () => {
    render(<BioBlock profile={{ ...profile, bio: null }} options={{}} />);
    expect(screen.getByText("No bio available.")).toBeInTheDocument();
  });

  it("renders all options when true", () => {
    const options = {
      showCompany: true,
      showLocation: true,
      showWebsite: true,
      showTwitter: true,
      showJoinedDate: true,
    };
    render(<BioBlock profile={profile} options={options} />);
    expect(screen.getByText("Test Company")).toBeInTheDocument();
    expect(screen.getByText("Test Location")).toBeInTheDocument();
    expect(screen.getByText("example.com")).toBeInTheDocument();
    expect(screen.getByText("@testtwitter")).toBeInTheDocument();
    expect(screen.getByText(/Joined/)).toBeInTheDocument();
  });
});
