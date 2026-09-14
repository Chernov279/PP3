import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { userService } from "../services/api";

interface ProfileAvatarProps {
  name: string;
  avatarUrl?: string | null;
  onAvatarChange: (url: string | null) => void;
}

export function ProfileAvatar({
  name,
  avatarUrl,
  onAvatarChange,
}: ProfileAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast.error("Допустимы только JPG и PNG до 5 МБ");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Файл больше 5 МБ");
      return;
    }

    setUploading(true);
    try {
      const url = await userService.uploadAvatar(file);
      onAvatarChange(url);
      toast.success("Аватар обновлён");
    } catch (e: unknown) {
      console.error(e);
      toast.error("Не удалось загрузить аватар");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    setUploading(true);
    try {
      await userService.deleteAvatar();
      onAvatarChange(null);
      toast.success("Аватар удалён");
    } catch (e) {
      console.error(e);
      toast.error("Не удалось удалить аватар");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20">
        <AvatarImage src={avatarUrl ?? undefined} alt={name} />
        <AvatarFallback className="text-lg">{initials || "?"}</AvatarFallback>
      </Avatar>
      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Camera className="h-4 w-4 mr-2" />
          )}
          Загрузить
        </Button>
        {avatarUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={uploading}
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Удалить
          </Button>
        )}
      </div>
    </div>
  );
}
