"use client";

import { useState } from "react";
import { signInAnonymously } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAnonymousSignIn = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Anonymous sign-in failed", error);
       toast({
        variant: "destructive",
        title: "Sign-in Failed",
        description: "Could not sign in. Please try again.",
      });
      setLoading(false);
    }
    // The onAuthStateChanged listener in AuthProvider will handle the redirect.
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/20 text-primary rounded-full p-3 w-fit mb-4">
            <Bot className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-headline">Welcome to KiroVerse</CardTitle>
          <CardDescription>Your personal AI code mentor and Web3 skill hub.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <p className="text-center text-muted-foreground text-sm">
              Sign in to start your learning journey.
            </p>
            <Button onClick={handleAnonymousSignIn} disabled={loading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Enter as Guest
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
