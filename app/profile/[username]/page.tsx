import { Suspense } from "react";
import UserProfileClient from "@/components/user/profile";
import type { Metadata } from "next";
import { getUserByUsername } from "@/actions/user";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    return { title: "Usuario no encontrado" };
  }

  return {
    title: `${user.name} (@${user.username})`,
    description:
      user.bio ??
      `Mirá las predicciones de ${user.name} en Cábala. ${user.stats?.correctPredictions ?? 0} aciertos · ${user.stats?.points ?? 0} puntos.`,
    openGraph: {
      title: `${user.name} (@${user.username}) | Cábala`,
      description:
        user.bio ??
        `${user.stats?.correctPredictions ?? 0} aciertos · ${user.stats?.points ?? 0} puntos`,
      images: user.image ? [{ url: user.image }] : [],
    },
  };
}

export default async function UserProfile({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const initialUserData = await getUserByUsername(username);

  return (
    <div className="">
      <Suspense
        fallback={<div className="text-center p-4">Cargando interfaz...</div>}
      >
        <UserProfileClient username={username} initialData={initialUserData} />
      </Suspense>
    </div>
  );
}
