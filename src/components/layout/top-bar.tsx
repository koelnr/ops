import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopBar() {
  return (
    <header className="flex gap-x-4 h-14 items-center border-b bg-background px-4">
      <SidebarTrigger />
      <span className="text-sm text-muted-foreground">Internal Operations</span>
    </header>
  );
}
