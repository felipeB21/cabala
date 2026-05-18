"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserByUsername } from "@/api/user";
import Image from "next/image";

type UserData = Awaited<ReturnType<typeof getUserByUsername>>;

interface UserProfileClientProps {
  username: string;
  initialData: UserData;
}

export default function UserProfileClient({
  username,
  initialData,
}: UserProfileClientProps) {
  const { data: user } = useQuery({
    queryKey: ["user", username],
    queryFn: () => getUserByUsername(username),
    enabled: !!username,
    staleTime: 1000 * 60 * 5,
    initialData: initialData ?? undefined,
  });

  if (!user)
    return (
      <div className="text-center p-4">El usuario @{username} no existe.</div>
    );

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full h-40 relative flex justify-center bg-secondary rounded-2xl">
        <div className="absolute top-1/2 flex flex-col items-center">
          <div className="relative rounded-full border-4 border-white overflow-hidden shadow-lg w-28 h-28">
            <Image
              src={user.image as string}
              alt={`@${user.username} Imagen`}
              layout="fill"
              objectFit="cover"
              priority
            />
          </div>
        </div>
      </div>

      <div className="h-10"></div>

      <div className="flex flex-col items-center justify-center mt-1 text-center px-4">
        <h1 className="text-2xl font-extrabold text-gray-950">{user.name}</h1>
        <p className="text-sm text-primary">@{user.username}</p>
        <p className="text-sm mt-3 max-w-sm" style={{ color: "#718096" }}>
          {user.bio}
        </p>
      </div>
    </div>
  );
}
