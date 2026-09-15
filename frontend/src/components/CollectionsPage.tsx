import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Collection, CollectionDetail } from "../types/collection";
import { Movie } from "../types/movie";
import { collectionService, movieFromCollectionItem, movieService } from "../services/api";
import { CollectionCard } from "./CollectionCard";
import { CollectionFormDialog } from "./CollectionFormDialog";
import { MovieCard } from "./MovieCard";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface CollectionsPageProps {
  currentUserId?: number;
  onMovieClick: (movie: Movie) => void;
  onBack: () => void;
  onCollectionsChanged?: () => void;
  initialCollectionId?: number | null;
}

const PAGE_SIZE = 12;

export function CollectionsPage({
  currentUserId,
  onMovieClick,
  onBack,
  onCollectionsChanged,
  initialCollectionId = null,
}: CollectionsPageProps) {
  const [tab, setTab] = useState<"mine" | "public">("mine");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [items, setItems] = useState<Collection[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [detail, setDetail] = useState<CollectionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [movieQuery, setMovieQuery] = useState("");
  const [movieResults, setMovieResults] = useState<Movie[]>([]);
  const [movieSearching, setMovieSearching] = useState(false);
  const [addingMovieId, setAddingMovieId] = useState<number | null>(null);

  const isOwner = Boolean(detail && currentUserId && detail.user_id === currentUserId);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const result =
        tab === "mine"
          ? await collectionService.listMine(page, PAGE_SIZE)
          : debouncedSearch.length >= 2
            ? await collectionService.search(debouncedSearch, page, PAGE_SIZE, true)
            : await collectionService.listPublic(page, PAGE_SIZE);
      setItems(result.items || []);
      setTotal(result.total || 0);
      setTotalPages(Math.max(1, result.pages || 1));
    } catch (e) {
      console.error(e);
      toast.error("Не удалось загрузить коллекции");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tab, page, debouncedSearch]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openDetail = useCallback(async (collectionId: number) => {
    setDetailLoading(true);
    try {
      const data = await collectionService.getById(collectionId);
      setDetail(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "";
      toast.error(message || "Не удалось открыть коллекцию");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialCollectionId) {
      openDetail(initialCollectionId);
    }
  }, [initialCollectionId, openDetail]);

  const refreshDetail = async () => {
    if (!detail) return;
    const data = await collectionService.getById(detail.id);
    setDetail(data);
  };

  const handleCreateOrUpdate = async (data: {
    title: string;
    description: string;
    is_public: boolean;
  }) => {
    setFormSubmitting(true);
    try {
      if (editing) {
        const updated = await collectionService.update(editing.id, {
          title: data.title,
          description: data.description || null,
          is_public: data.is_public,
        });
        toast.success("Коллекция обновлена");
        setDetail((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
      } else {
        const created = await collectionService.create({
          title: data.title,
          description: data.description || null,
          is_public: data.is_public,
        });
        toast.success("Коллекция создана");
        setTab("mine");
        setPage(1);
        await openDetail(created.id);
      }
      setFormOpen(false);
      setEditing(null);
      await loadList();
      onCollectionsChanged?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Не удалось сохранить коллекцию");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!detail) return;
    setDeleting(true);
    try {
      await collectionService.remove(detail.id);
      toast.success("Коллекция удалена");
      setDeleteOpen(false);
      setDetail(null);
      await loadList();
      onCollectionsChanged?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Не удалось удалить коллекцию");
    } finally {
      setDeleting(false);
    }
  };

  const searchCatalogMovies = async (query: string) => {
    setMovieQuery(query);
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setMovieResults([]);
      return;
    }
    setMovieSearching(true);
    try {
      const results = await movieService.searchFilmsInDb(trimmed, 1, 8);
      const existing = new Set((detail?.movies || []).map((m) => m.id));
      setMovieResults(results.filter((m) => !existing.has(m.id)));
    } catch (e) {
      console.error(e);
      setMovieResults([]);
    } finally {
      setMovieSearching(false);
    }
  };

  const handleAddMovie = async (movie: Movie) => {
    if (!detail) return;
    setAddingMovieId(movie.id);
    try {
      await collectionService.addMovie(detail.id, movie.id);
      toast.success("Фильм добавлен в коллекцию");
      setMovieQuery("");
      setMovieResults([]);
      await refreshDetail();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "";
      if (message.toLowerCase().includes("already")) {
        toast.info("Этот фильм уже в коллекции");
      } else if (message.toLowerCase().includes("not found")) {
        toast.error("Фильм не найден в каталоге сервиса");
      } else {
        toast.error(message || "Не удалось добавить фильм");
      }
    } finally {
      setAddingMovieId(null);
    }
  };

  const handleRemoveMovie = async (movie: Movie) => {
    if (!detail) return;
    try {
      await collectionService.removeMovie(detail.id, movie.id);
      setDetail((prev) =>
        prev ? { ...prev, movies: prev.movies.filter((m) => m.id !== movie.id) } : prev
      );
      toast.success("Фильм убран из коллекции");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Не удалось убрать фильм");
    }
  };

  const filteredMine =
    tab === "mine" && search.trim()
      ? items.filter((c) => {
          const q = search.trim().toLowerCase();
          return (
            c.title.toLowerCase().includes(q) ||
            (c.description || "").toLowerCase().includes(q)
          );
        })
      : items;

  if (detailLoading && !detail) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (detail) {
    const movies = detail.movies.map(movieFromCollectionItem);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button variant="outline" onClick={() => setDetail(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            К коллекциям
          </Button>
          {isOwner && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(detail);
                  setFormOpen(true);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Изменить
              </Button>
              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить
              </Button>
            </>
          )}
        </div>

        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-3xl font-semibold tracking-tight">{detail.title}</h1>
            <span className="text-sm text-muted-foreground border rounded-full px-3 py-1">
              {detail.is_public ? "Публичная" : "Личная"}
            </span>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            {detail.description?.trim() || "У этой коллекции пока нет описания"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Фильмов: {movies.length}
          </p>
        </div>

        {isOwner && (
          <div className="mb-8 space-y-3">
            <h3>Добавить фильм из каталога</h3>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Начните вводить название..."
                value={movieQuery}
                onChange={(e) => searchCatalogMovies(e.target.value)}
              />
            </div>
            {movieSearching && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Поиск в каталоге...
              </div>
            )}
            {movieResults.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {movieResults.map((movie) => (
                  <div key={movie.id} className="relative">
                    <MovieCard movie={movie} compact onClick={() => onMovieClick(movie)} />
                    <Button
                      size="sm"
                      className="absolute bottom-2 left-2 right-2"
                      disabled={addingMovieId === movie.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddMovie(movie);
                      }}
                    >
                      {addingMovieId === movie.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Добавить
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {movieQuery.trim().length >= 2 && !movieSearching && movieResults.length === 0 && (
              <p className="text-sm text-muted-foreground">
                В каталоге сервиса ничего не найдено. Добавлять можно фильмы, которые уже есть в базе.
              </p>
            )}
          </div>
        )}

        {movies.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {movies.map((movie) => (
              <div key={movie.id} className="relative">
                <MovieCard movie={movie} onClick={() => onMovieClick(movie)} />
                {isOwner && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 opacity-90"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveMovie(movie);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            В коллекции пока нет фильмов
          </div>
        )}

        <CollectionFormDialog
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditing(null);
          }}
          initial={editing}
          submitting={formSubmitting}
          onSubmit={handleCreateOrUpdate}
        />

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить коллекцию?</AlertDialogTitle>
              <AlertDialogDescription>
                «{detail.title}» будет удалена безвозвратно. Фильмы из каталога не пропадут.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                {deleting ? "Удаление..." : "Удалить"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <Button variant="outline" className="mb-4" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <h1 className="text-3xl font-semibold tracking-tight">Коллекции</h1>
          <p className="text-muted-foreground mt-1">
            Собирайте подборки и смотрите публичные коллекции других пользователей
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Создать коллекцию
        </Button>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as "mine" | "public");
          setPage(1);
          setSearch("");
        }}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="mine">Мои</TabsTrigger>
          <TabsTrigger value="public">Публичные</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={tab === "mine" ? "Найти среди своих" : "Поиск публичных коллекций"}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMine.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {tab === "mine" ? `Ваших коллекций: ${filteredMine.length}` : `Найдено: ${total}`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMine.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                isOwner={collection.user_id === currentUserId}
                onClick={() => openDetail(collection.id)}
              />
            ))}
          </div>
          {tab === "public" && totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Назад
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Далее
              </Button>
            </div>
          )}
          {tab === "mine" && !search.trim() && totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Назад
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Далее
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-dashed p-12 text-center space-y-3">
          <p className="text-muted-foreground">
            {tab === "mine"
              ? "У вас ещё нет коллекций. Создайте первую подборку."
              : debouncedSearch
                ? "Публичных коллекций по этому запросу нет"
                : "Публичных коллекций пока нет"}
          </p>
          {tab === "mine" && (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Создать коллекцию
            </Button>
          )}
        </div>
      )}

      <CollectionFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        initial={editing}
        submitting={formSubmitting}
        onSubmit={handleCreateOrUpdate}
      />
    </div>
  );
}
