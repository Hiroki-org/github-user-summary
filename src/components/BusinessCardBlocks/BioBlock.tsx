import type { UserProfile, CardDisplayOptions } from "@/lib/types";
import { BuildingIcon, CalendarIcon, LinkIcon, MapPinIcon, TwitterIcon } from "../Icons";

type BioBlockProps = {
  profile: UserProfile;
  options: CardDisplayOptions;
};

export const BioBlock = ({ profile, options }: BioBlockProps) => {
  const {
    showCompany = false,
    showLocation = false,
    showWebsite = false,
    showTwitter = false,
    showJoinedDate = false,
  } = options || {};

  return (
    <>
      <div className="mb-8">
        <p className="line-clamp-3 max-w-2xl text-2xl leading-relaxed text-gray-300">
          {profile.bio || "No bio available."}
        </p>
      </div>

      {(showCompany || showLocation || showWebsite || showTwitter || showJoinedDate) && (
        <div className="mb-10 flex flex-wrap gap-x-8 gap-y-3 text-lg text-gray-300">
          {showCompany && profile.company && (
            <div className="flex items-center gap-2">
              <BuildingIcon className="text-accent" />
              <span>{profile.company}</span>
            </div>
          )}
          {showLocation && profile.location && (
            <div className="flex items-center gap-2">
              <MapPinIcon className="text-accent" />
              <span>{profile.location}</span>
            </div>
          )}
          {showWebsite && profile.blog && (
            <div className="flex items-center gap-2">
              <LinkIcon className="text-accent" />
              <span className="max-w-[200px] truncate">
                {profile.blog.replace(/^https?:\/\//, "")}
              </span>
            </div>
          )}
          {showTwitter && profile.twitter_username && (
            <div className="flex items-center gap-2">
              <TwitterIcon className="text-accent" />
              <span>@{profile.twitter_username}</span>
            </div>
          )}
          {showJoinedDate && (
            <div className="flex items-center gap-2">
              <CalendarIcon className="text-accent" />
              <span>
                Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
};
