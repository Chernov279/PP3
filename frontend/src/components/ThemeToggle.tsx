import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Тема" disabled>
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  const isDark = (resolvedTheme ?? theme) === "dark";

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    const apply = () => setTheme(next);
    const doc = document as Document & {
      startViewTransition?: (callback: () => void) => void;
    };
    if (typeof doc.startViewTransition === "function") {
      doc.startViewTransition(apply);
      return;
    }
    apply();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Светлая тема" : "Тёмная тема"}
      onClick={toggleTheme}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
