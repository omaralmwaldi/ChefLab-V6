"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { canAccessPath, getDefaultAuthorizedPath } from "@/lib/rbac";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/login") return;
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    if (!canAccessPath(pathname)) {
      const fallbackPath = getDefaultAuthorizedPath();
      router.replace(fallbackPath === pathname ? "/login" : fallbackPath);
    }
  }, [router, pathname]);

  return <>{children}</>;
}
