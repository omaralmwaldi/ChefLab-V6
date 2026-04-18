"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { isAuthenticated } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const t = useTranslations("home");
  useEffect(() => {
    if (isAuthenticated()) router.replace("/dashboard");
    else router.replace("/login");
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">{t("redirecting")}</p>
    </div>
  );
}
