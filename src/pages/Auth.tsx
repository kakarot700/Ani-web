import Input from "@/components/Input";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { FcGoogle } from "react-icons/fc";
import { registerUser, findUser } from "@/lib/auth";
import useCurrentUser from "@/hooks/useCurrentUser";
import { searchShows } from "@/server/allanime";

const PosterWall = () => {
  const [posters, setPosters] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    searchShows({ sortBy: "Popular", limit: 16 })
      .then((p) =>
        alive &&
        setPosters(
          p.shows.filter((s) => s.thumbnail).map((s) => s.thumbnail as string)
        )
      )
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  if (posters.length === 0) return null;

  const row = (list: string[], keyPrefix: string, reverse: boolean, dur: string) => (
    <div
      className="flex w-max gap-3"
      style={{ animation: `${reverse ? "marquee-rev" : "marquee"} ${dur} linear infinite` }}
    >
      {[...list, ...list].map((src, i) => (
        <img
          key={`${keyPrefix}-${i}`}
          src={src}
          alt=""
          loading="lazy"
          className="h-44 w-32 shrink-0 rounded-lg object-cover md:h-56 md:w-40"
        />
      ))}
    </div>
  );

  const half = Math.ceil(posters.length / 2);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 -rotate-6 scale-125 space-y-3 opacity-40 blur-[2px]">
        {row(posters.slice(0, half), "a", false, "70s")}
        {row(posters.slice(half), "b", true, "90s")}
        {row(posters.slice(0, half), "c", false, "110s")}
      </div>
    </div>
  );
};

const Auth = () => {
  const navigate = useNavigate();
  const { mutate } = useCurrentUser();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [varient, setVarient] = useState("login");

  const toggleVarient = useCallback(() => {
    setError("");
    setVarient((currentVarient) =>
      currentVarient === "login" ? "register" : "login"
    );
  }, []);

  const login = useCallback(() => {
    setBusy(true);
    const user = findUser(email, password);
    window.setTimeout(() => {
      setBusy(false);
      if (!user) {
        setError("Invalid email or password.");
        return;
      }
      mutate(user);
      navigate("/profiles");
    }, 350);
  }, [email, password, mutate, navigate]);

  const register = useCallback(() => {
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      try {
        const user = registerUser(name, email, password);
        mutate(user);
        navigate("/profiles");
      } catch (err: any) {
        setError(err?.message ?? "Something went wrong.");
      }
    }, 350);
  }, [email, name, password, mutate, navigate]);

  const signInWithGoogle = useCallback(() => {
    mutate({
      name: "Guest Otaku",
      email: "guest@otaku.app",
      favoriteIds: [],
    });
    navigate("/profiles");
  }, [mutate, navigate]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-zinc-950">
      <PosterWall />

      {/* layered grading */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/60 to-zinc-950" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(700px 420px at 50% 30%, rgba(220,38,38,0.16), transparent 70%)",
        }}
      />
      <div className="noise-overlay" aria-hidden="true" />

      {/* vertical watermark */}
      <p
        className="font-jp pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 text-5xl font-bold tracking-[0.5em] text-white/[0.05] select-none lg:block"
        style={{ writingMode: "vertical-rl" }}
      >
        オタク 스트リーム
      </p>

      <nav className="relative z-10 px-6 py-6 md:px-16">
        <p className="font-display text-3xl tracking-wide text-white">
          <span className="text-red-600">Otaku</span>
          <span className="font-jp ml-2 text-sm tracking-[0.3em] text-zinc-500">オタク</span>
        </p>
      </nav>

      <div className="relative z-10 flex justify-center px-4 pb-24">
        <div className="w-full max-w-md animate-[fadeup_0.5s_ease]">
          <div className="rounded-xl bg-zinc-950/95 p-8 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.9)] ring-1 ring-zinc-800 md:p-10">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-red-500">
              {varient === "login" ? "Welcome back · おかえり" : "Join the crew · 参加する"}
            </p>
            <h2 className="font-display mt-2 text-5xl tracking-wide text-white">
              {varient === "login" ? "Sign In" : "Register"}
            </h2>

            <div className="mt-8 flex flex-col gap-4">
              {varient === "register" && (
                <Input
                  lable="Username"
                  onChange={(ev: any) => setName(ev.target.value)}
                  id="name"
                  type="text"
                  value={name}
                />
              )}
              <Input
                lable="Email"
                onChange={(ev: any) => setEmail(ev.target.value)}
                id="email"
                type="email"
                value={email}
              />
              <Input
                lable="Password"
                onChange={(ev: any) => setPassword(ev.target.value)}
                id="password"
                type="password"
                value={password}
              />
            </div>

            {error && (
              <p className="mt-3 rounded-md bg-red-600/10 px-3 py-2 text-sm font-semibold text-red-400 ring-1 ring-red-600/30">
                {error}
              </p>
            )}

            <button
              onClick={varient === "login" ? login : register}
              disabled={busy}
              className="mt-5 w-full rounded-md bg-red-600 py-3 font-bold text-white shadow-[0_10px_35px_-8px_rgba(220,38,38,0.7)] transition hover:-translate-y-0.5 hover:bg-red-500 active:translate-y-0 disabled:opacity-60"
            >
              {busy ? "…" : varient === "login" ? "Login" : "Sign Up"}
            </button>

            <div className="my-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-zinc-800" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-600">
                or continue with
              </span>
              <span className="h-px flex-1 bg-zinc-800" />
            </div>

            <div className="flex justify-center">
              <button
                onClick={signInWithGoogle}
                aria-label="Continue with Google"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white transition hover:-translate-y-0.5 hover:opacity-90"
              >
                <FcGoogle size={26} />
              </button>
            </div>

            <p className="mt-8 text-center text-sm text-zinc-500">
              {varient === "login" ? "First time using Otaku?" : "Already have an account?"}
              <span
                onClick={toggleVarient}
                className="ml-1 font-bold text-white transition hover:text-red-500 hover:underline cursor-pointer"
              >
                {varient === "login" ? "Create an account." : "Login."}
              </span>
            </p>
          </div>

          <p className="mt-6 text-center text-[11px] font-semibold tracking-wide text-zinc-600">
            4 streaming servers <span className="mx-1.5 text-red-600">·</span> Sub &amp; Dub
            <span className="mx-1.5 text-red-600">·</span> CC subtitles
            <span className="mx-1.5 text-red-600">·</span> Endless catalog
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
