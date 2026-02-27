import { notFound } from "next/navigation";
import { isValidGitHubUsername } from "@/lib/validators";

type Props = {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
};

export default async function UsernameLayout({ children, params }: Props) {
  const { username } = await params;
  if (!isValidGitHubUsername(username)) {
    notFound();
  }
  return <>{children}</>;
}
