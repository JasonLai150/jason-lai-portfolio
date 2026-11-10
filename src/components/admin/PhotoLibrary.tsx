import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { photoUrl, type PhotoEntry } from "@/lib/photos";
import { deletePhoto, updateCaption } from "@/lib/photosApi";

const BASE_URL = import.meta.env.VITE_PHOTOS_BASE_URL;

interface Props {
  photos: PhotoEntry[];
  password: string;
  onUpdated: (entry: PhotoEntry) => void;
  onRemoved: (id: string) => void;
}

type SaveState = { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "error"; message: string };

const LibraryCard = ({
  photo,
  password,
  onUpdated,
  onRemoved,
}: { photo: PhotoEntry } & Omit<Props, "photos">) => {
  const [draft, setDraft] = useState(photo.caption);
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const [deleting, setDeleting] = useState(false);

  const commit = async () => {
    const caption = draft.trim();
    if (caption === photo.caption || save.kind === "saving") return;
    setSave({ kind: "saving" });
    try {
      const entry = await updateCaption(password, photo.id, caption);
      onUpdated(entry);
      setDraft(entry.caption);
      setSave({ kind: "saved" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      setSave({ kind: "error", message });
      toast.error(message);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await deletePhoto(password, photo.id);
      onRemoved(photo.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="w-full aspect-square bg-gray-200 dark:bg-gray-700">
        <img
          src={photoUrl(BASE_URL, photo.thumb)}
          alt={photo.caption}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3 flex flex-col gap-2">
        <Input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setSave({ kind: "idle" });
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
        <p className="text-xs h-4 text-muted-foreground">
          {save.kind === "saving" && "saving…"}
          {save.kind === "saved" && "saved"}
          {save.kind === "error" && <span className="text-red-500">{save.message}</span>}
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={deleting}>
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this photo? This cannot be undone.</AlertDialogTitle>
              <AlertDialogDescription>{photo.caption}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

const PhotoLibrary = ({ photos, ...rest }: Props) => (
  <section>
    <h2 className="text-xl font-semibold text-foreground mb-4">Library ({photos.length})</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
      {photos.map((p) => (
        <LibraryCard key={p.id} photo={p} {...rest} />
      ))}
    </div>
  </section>
);

export default PhotoLibrary;
