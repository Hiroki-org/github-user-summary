import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

import { logger } from "@/lib/logger";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // Fetch minimal profile data for the OG image
  let name = username;
  let bio = "";
  let avatarUrl = "";
  let followers = 0;
  let publicRepos = 0;

  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: { Accept: "application/vnd.github.v3+json" },
      next: { revalidate: 600 },
    });
    if (res.ok) {
      const data = await res.json();
      name = data.name ?? username;
      bio = data.bio ?? "";
      avatarUrl = data.avatar_url ?? "";
      followers = data.followers ?? 0;
      publicRepos = data.public_repos ?? 0;
    }
  } catch (error) {
    logger.error(`Failed to fetch GitHub profile for OG image: ${username}`, error);
    // fallback to defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#0d1117",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt=""
              width={120}
              height={120}
              style={{
                borderRadius: "60px",
                marginRight: "32px",
                border: "3px solid #30363d",
              }}
            />
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: "48px",
                fontWeight: 700,
                color: "#e6edf3",
                lineHeight: 1.2,
              }}
            >
              {name}
            </div>
            <div
              style={{
                fontSize: "28px",
                color: "#8b949e",
                marginTop: "4px",
              }}
            >
              @{username}
            </div>
          </div>
        </div>

        {/* Bio */}
        {bio && (
          <div
            style={{
              fontSize: "24px",
              color: "#8b949e",
              marginBottom: "40px",
              lineHeight: 1.4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxHeight: "68px",
            }}
          >
            {bio.length > 120 ? `${bio.slice(0, 120)}…` : bio}
          </div>
        )}

        {/* Stats */}
        <div
          style={{
            display: "flex",
            gap: "48px",
            marginTop: "auto",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#58a6ff" }}>
              {publicRepos.toLocaleString()}
            </div>
            <div style={{ fontSize: "18px", color: "#8b949e", marginTop: "4px" }}>
              Repositories
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#58a6ff" }}>
              {followers.toLocaleString()}
            </div>
            <div style={{ fontSize: "18px", color: "#8b949e", marginTop: "4px" }}>
              Followers
            </div>
          </div>
        </div>

        {/* Branding */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "32px",
          }}
        >
          <div style={{ fontSize: "20px", color: "#484f58" }}>
            GitHub User Summary
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
