import { useNavigate } from "react-router-dom";
import useCurrentUser from "@/hooks/useCurrentUser";
import ProfileAvatar from "@/components/ProfileAvatar";

const Profiles = () => {
  const navigate = useNavigate();
  const { data: user, mutate } = useCurrentUser();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4">
      {/* ambient backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(800px 500px at 50% 35%, rgba(220,38,38,0.13), transparent 70%)",
        }}
      />
      <div className="noise-overlay" aria-hidden="true" />
      <p
        className="font-jp pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[22vw] font-bold text-white/[0.03] select-none"
        aria-hidden="true"
      >
        誰
      </p>

      <div className="relative flex animate-[fadeup_0.5s_ease] flex-col items-center">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-red-500">
          Profile · プロフィール
        </p>
        <h1 className="font-display mt-3 text-center text-5xl tracking-wide text-white md:text-7xl">
          Who is watching?
        </h1>

        <button
          onClick={() => navigate("/")}
          className="group mt-12 flex flex-col items-center"
        >
          <div className="h-40 w-40 overflow-hidden rounded-xl ring-2 ring-transparent transition-all duration-300 group-hover:-translate-y-1.5 group-hover:ring-red-600 group-hover:shadow-[0_20px_60px_-12px_rgba(220,38,38,0.55)] md:h-44 md:w-44">
            <ProfileAvatar />
          </div>
          <span className="mt-4 text-xl font-semibold text-zinc-400 transition group-hover:text-white">
            {user?.name}
          </span>
          <span className="mt-1 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 opacity-0 transition group-hover:opacity-100 group-hover:text-red-400 group-hover:border-red-600/50">
            Enter →
          </span>
        </button>

        <button
          onClick={() => {
            mutate(null);
            navigate("/auth");
          }}
          className="mt-14 text-xs font-semibold text-zinc-600 transition hover:text-red-500"
        >
          Sign out of Otaku
        </button>
      </div>
    </div>
  );
};

export default Profiles;
