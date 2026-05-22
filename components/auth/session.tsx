import { getSession } from "@/lib/session";
import { DropdownAvatar } from "./avatar";
import { SignIn } from "./sign-in";

export default async function Session() {
  const sessionData = await getSession();

  if (!sessionData?.session || !sessionData.user) {
    return <SignIn />;
  }

  return <DropdownAvatar user={sessionData.user} />;
}
