"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";

export function SignIn() {
  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button className="bg-background text-black">Iniciar sesión</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <div className="flex flex-col items-center justify-center">
            <DialogTitle>Iniciar Sesión</DialogTitle>
            <p>Inicia Sesión para continuar.</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 w-full">
            <Button variant={"outline"} className="w-full">
              <Image
                src={"/google.svg"}
                alt="Google SVG"
                width={12}
                height={12}
              />
              Continuar con Google
            </Button>
            <Button className="w-full">
              <Image
                src={"/discord.svg"}
                alt="Discord SVG"
                width={12}
                height={12}
              />
              Continuar con Discord
            </Button>
          </div>
        </DialogContent>
      </form>
    </Dialog>
  );
}
