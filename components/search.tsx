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
import { searchMatches } from "@/actions/teams";
import { cn } from "@/lib/utils";

export function SearchClient() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const enabled = debouncedQuery.length >= 2;

  const { data: users = [], isFetching: fetchingUsers } = useQuery({
    queryKey: ["search", "users", debouncedQuery],
    queryFn: () => searchUsers(debouncedQuery),
    enabled,
  });

  const { data: matches = [], isFetching: fetchingMatches } = useQuery({
    queryKey: ["search", "matches", debouncedQuery],
    queryFn: () => searchMatches(debouncedQuery),
    enabled,
  });

  const isPending = fetchingUsers || fetchingMatches;
  const totalResults = users.length + matches.length;

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
                    sizes="36px"
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

      {matches.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Partidos
          </p>
          {matches.map((m) => (
            <Link
              key={m.id}
              href={`/matches/${m.slug ?? m.id}`}
              className="flex items-center gap-3 bg-background border border-border/50 rounded-lg px-3.5 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate">
                  {m.homeTeam.name} vs {m.awayTeam.name}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {m.status === "finished"
                    ? `Finalizado · ${m.homeScore} - ${m.awayScore}`
                    : `Próximo · ${new Date(m.startsAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}`}
                </p>
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium px-2 py-0.5 rounded-full",
                  m.status === "finished"
                    ? "bg-[#EAF3DE] text-[#3B6D11]"
                    : "bg-blue-50 text-blue-600",
                )}
              >
                {m.status === "finished" ? "Finalizado" : "Predecir"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
