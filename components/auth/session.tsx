import { getSession } from "@/lib/session";
import { DropdownAvatar } from "./avatar";
import { SignIn } from "./sign-in";
import Notifications from "./notifications";

export default async function Session() {
  const sessionData = await getSession();

  if (!sessionData?.session || !sessionData.user) {
    return <SignIn />;
  }

  return (
    <div className="flex items-center gap-3">
      <Notifications />
      <DropdownAvatar user={sessionData.user} />
    </div>
  );
}
