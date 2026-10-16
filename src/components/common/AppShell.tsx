"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/navigation/Sidebar";
import { Header } from "@/components/navigation/Header";
import { MobileNav } from "@/components/navigation/MobileNav";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { localStore, OWNER_ADMIN_EMAIL } from "@/lib/storage/localState";
import { syncProfileFromUserMetadata } from "@/lib/supabase/profile";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/auth");

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        let loggedIn = false;

        if (isSupabaseConfigured && supabase) {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user) {
            loggedIn = true;
            document.cookie =
              "sabfitness_session=1; path=/; max-age=604800; SameSite=Lax";
            await syncProfileFromUserMetadata(data.session.user);
          }
        }

        if (!loggedIn) {
          const localUser = localStore.getUser();
          if (localUser && localUser.email && localUser.email.trim() !== "") {
            loggedIn = true;
            document.cookie =
              "sabfitness_session=1; path=/; max-age=604800; SameSite=Lax";

            const isOwner =
              localUser.email.toLowerCase().trim() ===
              OWNER_ADMIN_EMAIL.toLowerCase();
            if (isOwner && !localUser.isAdmin) {
              localStore.saveUser({ isAdmin: true });
            }
          }
        }

        if (!isMounted) return;

        // Requirement 7: Redirect logged-out users to /login and logged-in users to the dashboard.
        if (!loggedIn) {
          document.cookie = "sabfitness_session=; path=/; max-age=0";
          if (!isAuthRoute) {
            router.replace("/login");
            return;
          }
        } else {
          if (pathname === "/login" || pathname === "/signup") {
            router.replace("/");
            return;
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        if (isMounted) setCheckingAuth(false);
      }
    }

    checkAuth();

    if (isSupabaseConfigured && supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (session?.user) {
            document.cookie =
              "sabfitness_session=1; path=/; max-age=604800; SameSite=Lax";
            await syncProfileFromUserMetadata(session.user);
            if (pathname === "/login" || pathname === "/signup") {
              router.replace("/");
            }
          }
        } else if (event === "SIGNED_OUT") {
          document.cookie = "sabfitness_session=; path=/; max-age=0";
          if (!isAuthRoute) {
            router.replace("/login");
          }
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, [pathname, isAuthRoute, router]);

  if (isAuthRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        {children}
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
          <Header />
          <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
      <MobileNav />
    </>
  );
}
