import { Suspense } from "react";
import UserProfileClient from "@/components/user/profile";
import { getUserByUsername } from "@/api/user";
import { Button } from "@/components/ui/button";

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
      <Button>Seguir</Button>
    </div>
  );
}
