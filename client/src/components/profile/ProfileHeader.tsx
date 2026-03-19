import { Star, Settings } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ProfileHeaderProps {
  name: string;
  initials: string;
  handle: string;
  badge?: string;
  profileImage?: string | null;
  bio?: string | null;
  isOwnProfile?: boolean;
  onSettingsClick?: () => void;
}

export function ProfileHeader({
  name,
  initials,
  handle,
  badge,
  profileImage,
  bio,
  isOwnProfile,
  onSettingsClick,
}: ProfileHeaderProps) {
  return (
    <div className="text-center relative pt-10 px-5 pb-6">
      {/* Subtle gold gradient at top */}
      <div className="absolute top-0 left-0 right-0 h-[120px] pointer-events-none bg-gradient-to-b from-primary/[0.08] to-transparent" />

      {/* Settings icon for own profile */}
      {isOwnProfile && onSettingsClick && (
        <button
          onClick={onSettingsClick}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-transparent border-none cursor-pointer transition-colors active:bg-accent/50"
          aria-label="Profile settings"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      )}

      {/* Avatar */}
      <Avatar className="relative mx-auto mb-3 h-20 w-20 border-2 border-primary/30 shadow-[0_4px_24px_rgba(212,164,76,0.25)]">
        {profileImage ? (
          <AvatarImage src={profileImage} alt={name} />
        ) : (
          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-background font-display font-semibold text-[1.8rem]">
            {initials}
          </AvatarFallback>
        )}
      </Avatar>

      {/* Name */}
      <div className="font-display font-medium text-[1.4rem] mb-1">{name}</div>

      {/* Handle */}
      <div className="text-muted-foreground text-[0.8rem] mb-2">{handle}</div>

      {/* Bio */}
      {bio && (
        <p className="text-foreground/70 text-sm max-w-xs mx-auto mb-3 leading-relaxed">
          {bio}
        </p>
      )}

      {/* Badge */}
      {badge && (
        <span className="inline-flex items-center gap-1 text-primary uppercase bg-primary/[0.12] px-3 py-1 rounded-full text-[0.65rem] tracking-[0.05em]">
          <Star className="w-3 h-3 fill-primary" />
          {badge}
        </span>
      )}
    </div>
  );
}
