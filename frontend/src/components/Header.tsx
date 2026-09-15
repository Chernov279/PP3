import { useState } from "react";
import { Search, LogIn, LogOut, Library } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface HeaderProps {
  onSearchClick: () => void;
  onAccountClick: () => void;
  onCollectionsClick?: () => void;
  onLogoClick: () => void;
  onLoginClick: () => void;
  isAuthenticated: boolean;
  userName?: string;
  avatarUrl?: string | null;
  onLogout: (allDevices?: boolean) => void | Promise<void>;
}

export function Header({
  onSearchClick,
  onAccountClick,
  onCollectionsClick,
  onLogoClick,
  onLoginClick,
  isAuthenticated,
  userName,
  avatarUrl,
  onLogout
}: HeaderProps) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const initials = (userName || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const handleLogoutChoice = async (allDevices: boolean) => {
    setLoggingOut(true);
    try {
      await onLogout(allDevices);
      setLogoutOpen(false);
    } finally {
      setLoggingOut(false);
    }
  };

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
          {isAuthenticated && onCollectionsClick && (
            <Button variant="ghost" size="icon" onClick={onCollectionsClick} title="Коллекции">
              <Library className="h-5 w-5" />
            </Button>
          )}
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLogoutOpen(true)}
                title="Выйти"
              >
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

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Выйти из аккаунта?</DialogTitle>
            <DialogDescription>
              Можно закрыть только эту сессию или сразу отозвать вход на всех устройствах.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2 sm:space-x-0">
            <Button
              variant="outline"
              className="w-full"
              disabled={loggingOut}
              onClick={() => handleLogoutChoice(false)}
            >
              Выйти
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              disabled={loggingOut}
              onClick={() => handleLogoutChoice(true)}
            >
              Выйти со всех устройств
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              disabled={loggingOut}
              onClick={() => setLogoutOpen(false)}
            >
              Отмена
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
