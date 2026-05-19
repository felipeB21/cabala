"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserByUsername } from "@/actions/user";
import Image from "next/image";
import { Flame, Target, Trophy } from "lucide-react";

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
              fill
              priority
            />
          </div>
        </div>
      </div>

      <div className="h-10"></div>

      <div className="flex flex-col items-center justify-center mt-1 text-center px-4">
        <h1 className="text-2xl font-extrabold text-gray-950">{user.name}</h1>
        <p className="text-sm text-primary">@{user.username}</p>
        <p className="text-sm mt-3 max-w-sm">{user.bio}</p>
      </div>

      <div className="mt-8 flex items-center justify-center w-full max-w-md">
        <div className="flex w-full items-center justify-between bg-primary border border-gray-100 shadow-sm rounded-2xl p-5">
          <div className="flex flex-1 flex-col items-center gap-2">
            <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-full">
              <Target className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-gray-100">
                {user.stats?.correctPredictions ?? 0}
              </span>
              <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">
                Aciertos
              </span>
            </div>
          </div>

          <div className="w-px h-12 bg-gray-100"></div>

          <div className="flex flex-1 flex-col items-center gap-2">
            <div className="p-2.5 bg-amber-50 text-accent   rounded-full">
              <Trophy className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-gray-100">
                {user.stats?.points ?? 0}
              </span>
              <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">
                Puntos
              </span>
            </div>
          </div>

          <div className="w-px h-12 bg-gray-100"></div>

          <div className="flex flex-1 flex-col items-center gap-2">
            <div className="p-2.5 bg-orange-50 text-orange-500 rounded-full">
              <Flame className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-gray-100">
                {user.stats?.streak ?? 0}
              </span>
              <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">
                Racha
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
