import React from "react";
import { Link } from "react-router-dom";

interface MobileMenuProps {
  visible?: boolean;
}

const ITEMS = [
  { label: "Home", to: "/" },
  { label: "Seasons", to: "/seasons" },
  { label: "Browse All", to: "/browse" },
  { label: "Most Popular", to: "/browse?sort=Popular" },
  { label: "Recently Added", to: "/browse?sort=Recent" },
  { label: "Recently Updated", to: "/browse?sort=Latest_Update" },
  { label: "Top Rated", to: "/browse?sort=Top" },
  { label: "My List", to: "/mylist" },
  { label: "History", to: "/history" },
  { label: "Stats", to: "/stats" },
  { label: "Movies", to: "/browse?types=Movie" },
  { label: "TV", to: "/browse?types=TV" },
  { label: "OVA", to: "/browse?types=OVA" },
  { label: "ONA", to: "/browse?types=ONA" },
  { label: "Specials", to: "/browse?types=Special" },
];

const MobileMenu: React.FC<MobileMenuProps> = ({ visible }) => {
  if (!visible) {
    return null;
  }
  return (
    <div className="absolute left-0 top-8 flex max-h-[70vh] w-56 flex-col overflow-y-auto border-2 border-gray-800 bg-black py-4 thin-scroll">
      <div className="flex flex-col gap-3">
        {ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="px-4 text-center text-sm text-white transition hover:underline"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MobileMenu;
