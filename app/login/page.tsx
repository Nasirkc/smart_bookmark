"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) router.replace("/dashboard");
    };
    check();
  }, [router]);

  async function handleGoogleLogin() {
    console.log(process.env.NEXT_PUBLIC_SITE_URL);
     console.log(window.location.origin);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-zinc-50 to-zinc-100">
      <div className="w-full max-w-md">
        <MagicCard
          className="p-8 md:p-10 bg-white/80 backdrop-blur-xl border border-zinc-200/80 shadow-2xl rounded-2xl"
          gradientColor="#fafafa"
          gradientOpacity={0.5}
        >
          <div className="text-center space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                Smart Bookmarks
              </h1>
              <p className="mt-2 text-zinc-500 text-base">
                Save and sync your links across devices. Sign in to get started.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-14 px-6 text-base font-semibold text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 rounded-2xl flex items-center justify-center gap-3"
            >
              <GoogleIcon className="size-6 shrink-0" />
              Continue with Google
            </Button>
          </div>
        </MagicCard>
      </div>
    </div>
  );
}
