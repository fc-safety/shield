import { Moon, Sun } from "lucide-react";
import { Theme, useTheme } from "remix-themes";

import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function ModeToggle() {
  const [, setTheme] = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <Sun className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span>Theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme(Theme.LIGHT)}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme(Theme.DARK)}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme(null)}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
