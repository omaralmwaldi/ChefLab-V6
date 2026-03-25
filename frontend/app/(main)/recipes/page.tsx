"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RecipesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/review-recipes");
  }, [router]);
  return <p className="text-gray-500">Redirecting...</p>;
}
