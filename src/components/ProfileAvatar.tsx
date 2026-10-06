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
          <stop offset="0%" stopColor="#7f1d1d" />
          <stop offset="55%" stopColor="#3f3f46" />
          <stop offset="100%" stopColor="#18181b" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" fill="url(#otaku-av)" />
      {/* stylized anime silhouette */}
      <path
        d="M32 12c-9 0-15 6.5-15 15 0 3 .8 5.6 2.2 7.8L17 46c3 3.4 8.4 6 15 6s12-2.6 15-6l-2.2-11.2C46.2 32.6 47 30 47 27c0-8.5-6-15-15-15z"
        fill="#09090b"
        opacity="0.55"
      />
      <circle cx="32" cy="27" r="10.5" fill="#09090b" opacity="0.85" />
      <path d="M18 54c2.8-7.5 8-11.5 14-11.5S43.2 46.5 46 54" fill="#09090b" opacity="0.85" />
      {/* eyes */}
      <rect x="25.5" y="25" width="4.5" height="2" rx="1" fill="#f4f4f5" opacity="0.9" />
      <rect x="34" y="25" width="4.5" height="2" rx="1" fill="#f4f4f5" opacity="0.9" />
      {/* headband slash */}
      <rect x="16" y="18.5" width="32" height="4" rx="2" fill="#dc2626" opacity="0.9" />
      <rect x="28" y="17.5" width="8" height="6" rx="1.5" fill="#a1a1aa" />
      <path d="M30 20.5l4-1M30 19l4 3" stroke="#3f3f46" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
};

export default ProfileAvatar;
