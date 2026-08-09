import { UserProfile } from "@/lib/types";

type Props = {
  profile: UserProfile;
};

export const AvatarBlock = ({ profile }: Props) => (
  <div className="mb-10 flex items-center gap-8">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={profile.avatar_url}
      alt={profile.login}
      className="h-40 w-40 rounded-full border-4 border-card-border shadow-xl"
      crossOrigin="anonymous"
    />
    <div className="min-w-0 flex-1">
      <h1 className="mb-2 break-words text-5xl font-bold leading-tight tracking-tight text-white">
        {profile.name || profile.login}
      </h1>
      <p className="break-all text-3xl font-medium text-gray-400">@{profile.login}</p>
    </div>
  </div>
);
