import { Search, LogIn, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  onSearchClick: () => void;
  onAccountClick: () => void;
  onLogoClick: () => void;
  onLoginClick: () => void;
  isAuthenticated: boolean;
  userName?: string;
  avatarUrl?: string | null;
  onLogout: () => void;
}

export function Header({
  onSearchClick,
  onAccountClick,
  onLogoClick,
  onLoginClick,
  isAuthenticated,
  userName,
  avatarUrl,
  onLogout
}: HeaderProps) {
  const initials = (userName || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <button 
          onClick={onLogoClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground">🎬</span>
          </div>
          <h1>КиноРек</h1>
        </button>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={onSearchClick}>
            <Search className="h-5 w-5" />
          </Button>

          {isAuthenticated ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={onAccountClick}
                title={userName}
                className="rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl ?? undefined} alt={userName} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              </Button>
              <Button variant="ghost" size="icon" onClick={onLogout} title="Выйти">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" onClick={onLoginClick}>
              <LogIn className="h-4 w-4 mr-2" />
              Войти
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}