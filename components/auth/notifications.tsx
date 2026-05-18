import { Bell } from "lucide-react";
import { Button } from "../ui/button";

export default function Notifications() {
  return (
    <Button variant="ghost" size="icon" className="group hover:bg-neutral-100">
      <Bell
        size={16}
        className="text-white transition-colors duration-200 group-hover:text-black"
      />
    </Button>
  );
}
