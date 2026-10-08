// Profile avatar — drawn in the app's own brand palette so it sits
// natively on the frosted chrome: dark-navy base (#232A44) with the
// signature periwinkle → peach gradient (#7C8CF8 → #E8B99A) used by
// the favicon and the aurora backdrop, plus a soft glow for depth.
const ProfileAvatar = () => {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-full w-full"
      role="img"
      aria-label="Profile avatar"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="otaku-av" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8E9BFF" />
          <stop offset="55%" stopColor="#7C8CF8" />
          <stop offset="100%" stopColor="#E8B99A" />
        </linearGradient>
        <radialGradient id="otaku-av-glow" cx="50%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#7C8CF8" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#7C8CF8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* base + glow */}
      <rect width="64" height="64" fill="#232A44" />
      <rect width="64" height="64" fill="url(#otaku-av-glow)" />

      {/* shoulders + head silhouette, in the brand gradient */}
      <path
        d="M8 64c0-12 10.7-20 24-20s24 8 24 20z"
        fill="url(#otaku-av)"
        opacity="0.9"
      />
      <circle cx="32" cy="30" r="15" fill="url(#otaku-av)" />

      {/* frosted face plate */}
      <ellipse cx="32" cy="31" rx="10.5" ry="11.5" fill="#232A44" opacity="0.82" />

      {/* headband + plate */}
      <rect x="17" y="20" width="30" height="4.5" rx="2.2" fill="url(#otaku-av)" />
      <rect x="28" y="18.5" width="8" height="7" rx="2" fill="#E8B99A" opacity="0.95" />

      {/* glowing eyes */}
      <rect x="25.5" y="30" width="5" height="2.4" rx="1.2" fill="#E8B99A" />
      <rect x="33.5" y="30" width="5" height="2.4" rx="1.2" fill="#E8B99A" />
    </svg>
  );
};

export default ProfileAvatar;
