import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import PasswordGate, { PASSWORD_KEY } from "@/components/admin/PasswordGate";
import PhotoLibrary from "@/components/admin/PhotoLibrary";
import UploadQueue from "@/components/admin/UploadQueue";
import { sortPhotos, type PhotoEntry } from "@/lib/photos";
import { fetchManifest } from "@/lib/photosApi";

const readPassword = () => sessionStorage.getItem(PASSWORD_KEY);

const Admin = () => {
  const [password, setPassword] = useState<string | null>(readPassword);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!password) return;
    let cancelled = false;
    fetchManifest(import.meta.env.VITE_PHOTOS_BASE_URL)
      .then((m) => !cancelled && setPhotos(sortPhotos(m.photos)))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Failed to load photos"));
    return () => {
      cancelled = true;
    };
  }, [password]);

  const logOut = () => {
    sessionStorage.removeItem(PASSWORD_KEY);
    setPassword(null);
    setPhotos([]);
  };

  const onAdded = (entry: PhotoEntry) => setPhotos((ps) => sortPhotos([...ps, entry]));
  const onUpdated = (entry: PhotoEntry) =>
    setPhotos((ps) => sortPhotos(ps.map((p) => (p.id === entry.id ? entry : p))));
  const onRemoved = (id: string) => setPhotos((ps) => ps.filter((p) => p.id !== id));

  return (
    <div className="min-h-screen bg-[hsl(50_5%_90%)] dark:bg-[hsl(180_5%_10%)] pb-16">
      {password ? (
        <div className="px-4 md:px-6 lg:px-8 pt-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-foreground">Photo admin</h1>
              <Button variant="outline" onClick={logOut}>
                Log out
              </Button>
            </div>
            <UploadQueue password={password} onAdded={onAdded} />
            {error && <p className="text-red-500 mb-4">Error: {error}</p>}
            <PhotoLibrary photos={photos} password={password} onUpdated={onUpdated} onRemoved={onRemoved} />
          </div>
        </div>
      ) : (
        <PasswordGate onUnlocked={() => setPassword(readPassword())} />
      )}
    </div>
  );
};

export default Admin;
