import { requireUser } from "@/lib/session";
import SettingsForm from "@/components/auth/settings";

export default async function Settings() {
  const session = await requireUser();

  return <SettingsForm session={session} />;
}
