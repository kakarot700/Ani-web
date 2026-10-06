import useCurrentUser from "@/hooks/useCurrentUser";
import { useNavigate } from "react-router-dom";
import ProfileAvatar from "./ProfileAvatar";

interface AccountMenuProps {
  visable?: boolean;
}

const AccountMenu: React.FC<AccountMenuProps> = ({ visable }) => {
  const navigate = useNavigate();
  const { data, mutate } = useCurrentUser();

  if (!visable) {
    return null;
  }

  const signOut = () => {
    mutate(null);
    navigate("/auth");
  };

  return (
    <div className="bg-black w-56 absolute top-14 right-0 py-5 flex-col border-2 border-gray-800 flex">
      <div className="flex flex-col gap-3">
        <div className="px-3 group/item flex flex-row gap-3 items-center w-full">
          <div className="w-8 rounded-md overflow-hidden">
            <ProfileAvatar />
          </div>
          <p className="text-white text-sm group-hover/item:underline">
            {data?.name}
          </p>
        </div>
      </div>
      <hr className="bg-gray-600 border-0 h-px my-4" />
      <div
        onClick={signOut}
        className="px-3 text-center text-white text-sm hover:underline cursor-pointer"
      >
        Sign Out
      </div>
    </div>
  );
};

export default AccountMenu;
