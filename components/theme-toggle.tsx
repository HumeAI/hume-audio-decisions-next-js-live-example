"use client";

import { MoonIcon, SunIcon } from "@primer/octicons-react";

import { toggleTheme } from "@/lib/theme";

import { Button } from "./button";

export function ThemeToggle() {
  // The icon follows `data-theme` through CSS, since the theme is only known
  // in the browser and the server renders the button too.
  return (
    <Button
      variant="icon"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      <MoonIcon size={20} className="dark:hidden" />
      <SunIcon size={20} className="hidden dark:block" />
    </Button>
  );
}
