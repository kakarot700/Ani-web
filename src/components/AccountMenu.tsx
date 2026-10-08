import { Link } from "react-router-dom";
import { BsBookmarkHeartFill, BsClockHistory, BsGraphUpArrow } from "react-icons/bs";
import useCurrentUser from "@/hooks/useCurrentUser";
import ProfileAvatar from "./ProfileAvatar";

interface AccountMenuProps {
  visable?: boolean;
}

const LINKS = [
  { to: "/mylist", label: "My List", icon: <BsBookmarkHeartFill size={13} /> },
  { to: "/history", label: "Watch history", icon: <BsClockHistory size={13} /> },
  { to: "/stats", label: "Stats & achievements", icon: <BsGraphUpArrow size={13} /> },
];

/**
 * There are no accounts — this is a local profile card. It shows who is
 * watching and links to everything saved on this device.
 */
const AccountMenu: React.FC<AccountMenuProps> = ({ visable }) => {
  const { data } = useCurrentUser();

  if (!visable) return null;

  return (
    <div className="card-light absolute right-0 top-12 w-[268px] overflow-hidden rounded-[20px] p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 overflow-hidden rounded-full">
          <ProfileAvatar />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-[var(--ink)]">{data.name}</p>
          <p className="truncate text-[11.5px] text-[var(--ink-soft)]">
            Saved on this device
          </p>
        </div>
      </div>

      <p className="mt-3 text-[11.5px] leading-relaxed text-[var(--ink-soft)]">
        No account needed. Your list, history and stats live in this browser only.
      </p>

      <div className="mt-3 border-t border-black/[0.07] pt-1.5">
        {LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-[13px] font-medium text-[var(--ink)] transition hover:bg-black/[0.05]"
          >
            <span className="text-[var(--ink-soft)]">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AccountMenu;
