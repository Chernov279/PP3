import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import { useAuth } from "../contexts/AuthContext";
import { Film, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { toast } from "sonner";
import { TEST_USER } from "../data/testUser";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({
  open,
  onOpenChange,
}: AuthDialogProps) {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "login" | "register"
  >("login");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register form state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] =
    useState("");
  const [registerError, setRegisterError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    // Валидация
    if (!loginEmail || !loginPassword) {
      setLoginError("Пожалуйста, заполните все поля");
      setIsLoggingIn(false);
      return;
    }

    const success = await login(loginEmail, loginPassword);

    if (success) {
      // Очищаем форму
      setLoginEmail("");
      setLoginPassword("");
      toast.success("Добро пожаловать!");
      onOpenChange(false);
    } else {
      setLoginError("Неверный email или пароль");
    }

    setIsLoggingIn(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    setIsRegistering(true);

    // Валидация
    if (
      !registerName ||
      !registerEmail ||
      !registerPassword ||
      !registerConfirmPassword
    ) {
      setRegisterError("Пожалуйста, заполните все поля");
      setIsRegistering(false);
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setRegisterError("Пароли не совпадают");
      setIsRegistering(false);
      return;
    }

    if (registerPassword.length < 6) {
      setRegisterError(
        "Пароль должен быть не менее 6 символов",
      );
      setIsRegistering(false);
      return;
    }

    // Email валидация
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerEmail)) {
      setRegisterError("Введите корректный email");
      setIsRegistering(false);
      return;
    }

    const success = await register(
      registerEmail,
      registerPassword,
      registerName,
    );

    if (success) {
      // Очищаем форму
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");
      toast.success("Регистрация успешна! Добро пожаловать!");
      onOpenChange(false);
    } else {
      setRegisterError(
        "Пользователь с таким email уже существует",
      );
    }

    setIsRegistering(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Film className="h-6 w-6 text-primary" />
            <DialogTitle>КиноРек</DialogTitle>
          </div>
          <DialogDescription>
            Войдите в аккаунт или зарегистрируйтесь, чтобы
            получать персональные рекомендации фильмов
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) =>
            setActiveTab(v as "login" | "register")
          }
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Вход</TabsTrigger>
            <TabsTrigger value="register">
              Регистрация
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Тестовый аккаунт:</strong>
                <br />
                Email: {TEST_USER.email}
                <br />
                Пароль: {TEST_USER.password}
              </AlertDescription>
            </Alert>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="example@mail.com"
                  value={loginEmail}
                  onChange={(e) =>
                    setLoginEmail(e.target.value)
                  }
                  disabled={isLoggingIn}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Пароль</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••"
                  value={loginPassword}
                  onChange={(e) =>
                    setLoginPassword(e.target.value)
                  }
                  disabled={isLoggingIn}
                />
              </div>

              {loginError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {loginError}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Вход..." : "Войти"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form
              onSubmit={handleRegister}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="register-name">Имя</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Иван Иванов"
                  value={registerName}
                  onChange={(e) =>
                    setRegisterName(e.target.value)
                  }
                  disabled={isRegistering}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="example@mail.com"
                  value={registerEmail}
                  onChange={(e) =>
                    setRegisterEmail(e.target.value)
                  }
                  disabled={isRegistering}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">
                  Пароль
                </Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••"
                  value={registerPassword}
                  onChange={(e) =>
                    setRegisterPassword(e.target.value)
                  }
                  disabled={isRegistering}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm-password">
                  Подтвердите пароль
                </Label>
                <Input
                  id="register-confirm-password"
                  type="password"
                  placeholder="••••••"
                  value={registerConfirmPassword}
                  onChange={(e) =>
                    setRegisterConfirmPassword(e.target.value)
                  }
                  disabled={isRegistering}
                />
              </div>

              {registerError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {registerError}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isRegistering}
              >
                {isRegistering
                  ? "Регистрация..."
                  : "Зарегистрироваться"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
