"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { searchUsers } from "@/actions/user";
import { searchTeams } from "@/actions/teams";

export function SearchClient() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const enabled = debouncedQuery.length >= 2;

  const { data: users = [], isFetching: fetchingUsers } = useQuery({
    queryKey: ["search", "users", debouncedQuery],
    queryFn: () => searchUsers(debouncedQuery),
    enabled,
  });

  const { data: teams = [], isFetching: fetchingTeams } = useQuery({
    queryKey: ["search", "teams", debouncedQuery],
    queryFn: () => searchTeams(debouncedQuery),
    enabled,
  });

  const isPending = fetchingUsers || fetchingTeams;
  const totalResults = users.length + teams.length;

  return (
    <div className="flex flex-col gap-5">
      <InputGroup>
        <InputGroupAddon>
          <Search className="w-4 h-4" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Buscar usuarios o equipos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {enabled && (
          <InputGroupAddon align="inline-end">
            {isPending ? "..." : `${totalResults} resultados`}
          </InputGroupAddon>
        )}
      </InputGroup>

      {!enabled && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Escribí al menos 2 caracteres para buscar
        </p>
      )}

      {enabled && !isPending && totalResults === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Sin resultados para {query}
        </p>
      )}

      {users.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Usuarios
          </p>
          {users.map((user) => (
            <Link
              key={user.id}
              href={`/profile/${user.username}`}
              className="flex items-center gap-3 bg-background border border-border/50 rounded-lg px-3.5 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-muted shrink-0 relative overflow-hidden flex items-center justify-center text-xs font-medium text-muted-foreground">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? ""}
                    fill
                    className="object-cover"
                  />
                ) : (
                  user.name?.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate">{user.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  @{user.username}
                  {user.stats &&
                    ` · ${user.stats.points.toLocaleString()} pts · ${user.stats.correctPredictions} aciertos`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {teams.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Equipos
          </p>
          {teams.map((team) => (
            <div
              key={team.id}
              className="flex items-center gap-3 bg-background border border-border/50 rounded-lg px-3.5 py-3"
            >
              <div className="w-9 h-9 rounded-full bg-muted shrink-0 relative overflow-hidden flex items-center justify-center text-xs font-medium text-muted-foreground">
                {team.logo ? (
                  <Image
                    src={team.logo}
                    alt={team.name}
                    fill
                    className="object-contain p-1"
                  />
                ) : (
                  (team.shortName ?? team.name.slice(0, 3).toUpperCase())
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate">{team.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  Liga Profesional Argentina
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
