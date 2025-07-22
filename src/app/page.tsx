"use client";

import { useAuth } from "@/lib/firebase/auth";
import KiroApp from "@/components/KiroApp";
import Auth from "@/components/Auth";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <main>{user ? <KiroApp user={user} /> : <Auth />}</main>;
}
