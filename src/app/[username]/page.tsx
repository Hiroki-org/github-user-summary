import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { fetchUserSummary } from "@/lib/github";
import { UserNotFoundError } from "@/lib/types";

import UserSummaryView from "@/components/UserSummaryView";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} - GitHub User Summary`,
    description: `GitHub profile summary for ${username}.`,
    openGraph: {
      title: `${username} - GitHub User Summary`,
      description: `GitHub profile summary for ${username}.`,
      images: [`/api/og/${encodeURIComponent(username)}`],
    },
    twitter: {
      card: "summary_large_image",
      title: `${username} - GitHub User Summary`,
      images: [`/api/og/${encodeURIComponent(username)}`],
    },
  };
}

export default async function UserPage({ params }: Props) {
  const { username } = await params;
  const session = await getServerSession(authOptions);
  const token = session?.accessToken;

  let summary;
  try {
    summary = await fetchUserSummary(username, token);
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      notFound();
    }
    throw err;
  }

  return <UserSummaryView username={username} summary={summary} />;
}
