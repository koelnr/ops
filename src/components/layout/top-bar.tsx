import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import { DarkModeToggle } from "./dark-mode-toggle";

export function TopBar() {
  return (
    <header className="flex gap-x-4 h-14 items-center border-b bg-background px-4">
      <SidebarTrigger />
      <span className="text-sm text-muted-foreground">Internal Operations</span>
      <div className="ml-auto flex items-center gap-2">
        <DarkModeToggle />
        <UserButton />
      </div>
    </header>
  );
}
