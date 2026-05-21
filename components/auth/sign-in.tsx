"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";

type AuthProvider = "google" | "twitch";

export function SignIn() {
  const handleSignIn = async (provider: AuthProvider) => {
    try {
      await authClient.signIn.social({
        provider: provider,

        callbackURL: "/",
      });
    } catch (error) {
      console.error("Error al iniciar sesión con:", provider, error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-background text-black hover:bg-neutral-100">
          Iniciar sesión
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <div className="flex flex-col items-center justify-center text-center gap-1">
          <DialogTitle className="text-xl font-bold">
            Iniciar Sesión
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Inicia Sesión para continuar.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 w-full mt-4">
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => handleSignIn("google")}
          >
            <Image src="/google.svg" alt="Google logo" width={16} height={16} />
            Continuar con Google
          </Button>

          <Button
            type="button"
            className="w-full flex items-center justify-center gap-2  "
            onClick={() => handleSignIn("twitch")}
          >
            <Image src="/twitch.svg" alt="Twitch logo" width={16} height={16} />
            Continuar con Twitch
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
