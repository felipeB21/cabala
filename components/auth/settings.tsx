"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { User } from "@/types/user";

interface SettingsFormProps {
  session: User;
}

interface FormState {
  name: string;
  username: string;
  bio: string;
}

export default function SettingsForm({ session }: SettingsFormProps) {
  const [form, setForm] = useState<FormState>({
    name: session.name ?? "",
    username: session.username ?? "",
    bio: session.bio ?? "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const res = await authClient.updateUser({
        name: form.name,
        username: form.username,
        bio: form.bio,
      } as Parameters<typeof authClient.updateUser>[0]);

      if (res.error) {
        toast.error(res.error.message ?? "Error inesperado");
        return;
      }

      toast.success("Perfil actualizado, refresca la pagina.");
    } catch {
      toast.error("Error inesperado");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-md">
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border/50">
        <div className="relative w-14 h-14 rounded-full overflow-hidden bg-muted border border-border/50 flex items-center justify-center shrink-0">
          {session.image ? (
            <Image
              src={session.image}
              alt="Imagen de perfil"
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <span className="text-lg font-medium text-muted-foreground">
              {session.name?.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm font-medium">{session.name}</p>
          <p className="text-xs text-muted-foreground">@{session.username}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            La foto se actualiza desde Google, Twitch o Kick
          </p>
        </div>
      </div>

      {/* Nombre */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name" className="text-[13px]">
          Nombre
        </Label>
        <Input
          id="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          placeholder="Tu nombre"
          maxLength={50}
        />
      </div>

      {/* Username */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username" className="text-[13px]">
          Nombre de usuario
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            @
          </span>
          <Input
            id="username"
            type="text"
            value={form.username}
            onChange={handleChange}
            placeholder="username"
            maxLength={30}
            className="pl-7"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          cabala.ar/profile/{form.username || "username"}
        </p>
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-[13px]">Email</Label>
        <p className="text-sm text-muted-foreground px-1">{session.email}</p>
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bio" className="text-[13px]">
          Bio
        </Label>
        <Textarea
          id="bio"
          value={form.bio}
          onChange={handleChange}
          placeholder="Contá algo sobre vos..."
          className="resize-none"
          maxLength={160}
          rows={3}
        />
        <p className="text-[11px] text-muted-foreground text-right">
          {form.bio.length}/160
        </p>
      </div>

      <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg border border-border/50">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
          Cuenta creada el
        </span>
        <span className="text-sm font-medium">
          {format(new Date(session.createdAt), "d 'de' MMMM 'de' yyyy", {
            locale: es,
          })}
        </span>
      </div>

      <Button type="submit" disabled={isUpdating} className="w-full sm:w-auto">
        {isUpdating ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
