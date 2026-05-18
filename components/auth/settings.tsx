"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { User } from "@/types/user";

export default function SettingsForm({ session }: { session: User }) {
  const [name, setName] = useState(session.name || "");
  const [username, setUsername] = useState(session.username || "");
  const [bio, setBio] = useState(session.bio || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  const handleUpdate = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    setError("");

    try {
      await authClient.updateUser(
        {
          name,
          username,
          bio,
        },
        {
          onError(context) {
            setError(context.error.message);
          },
        },
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-6 max-w-md">
      <div className="space-y-2">
        <Label>Imagen de perfil</Label>
        <div className="flex items-center gap-4">
          {session.image ? (
            <Image
              src={session.image}
              alt="Imagen de perfil"
              width={50}
              height={50}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center border" />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Nombre de usuario</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Email</Label>
        <p className="text-sm text-muted-foreground px-1">{session.email}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Agrega una Bio"
          className="resize-none"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-muted-foreground">Cuenta creada el</Label>
        <p className="text-sm font-medium">
          {format(new Date(session.createdAt), "d 'de' MMMM", { locale: es })}
        </p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Button type="submit" disabled={isUpdating} className="w-full sm:w-auto">
        {isUpdating ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
