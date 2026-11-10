import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ALLOWED_CONTENT_TYPES, captionFromFilename, type PhotoEntry } from "@/lib/photos";
import { uploadPhoto, type UploadStage } from "@/lib/uploadPhoto";

const UNSUPPORTED = "Unsupported file type";
const ACCEPT = "image/jpeg,image/png,image/webp";

type RowStage = "queued" | UploadStage | "error";

interface Row {
  key: number;
  file: File;
  caption: string;
  stage: RowStage;
  error?: string;
  previewUrl: string;
}

const STAGE_LABEL: Record<RowStage, string> = {
  queued: "queued",
  thumbnail: "making thumbnail…",
  dimensions: "reading size…",
  signing: "signing…",
  "uploading-full": "uploading photo…",
  "uploading-thumb": "uploading thumbnail…",
  saving: "saving…",
  done: "done",
  error: "error",
};

interface Props {
  password: string;
  onAdded: (entry: PhotoEntry) => void;
}

const UploadQueue = ({ password, onAdded }: Props) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const rowsRef = useRef<Row[]>([]);
  const nextKey = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);

  rowsRef.current = rows;

  // Revoke any remaining object URLs on unmount.
  useEffect(() => {
    return () => rowsRef.current.forEach((r) => URL.revokeObjectURL(r.previewUrl));
  }, []);

  const patch = (key: number, change: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...change } : r)));

  const removeRow = (key: number) => {
    const row = rowsRef.current.find((r) => r.key === key);
    if (row) URL.revokeObjectURL(row.previewUrl);
    setRows((rs) => rs.filter((r) => r.key !== key));
  };

  const addFiles = (files: FileList | File[]) => {
    const added: Row[] = Array.from(files).map((file) => {
      const ok = file.type in ALLOWED_CONTENT_TYPES;
      return {
        key: nextKey.current++,
        file,
        caption: captionFromFilename(file.name),
        stage: ok ? "queued" : "error",
        error: ok ? undefined : UNSUPPORTED,
        previewUrl: URL.createObjectURL(file),
      };
    });
    setRows((rs) => [...rs, ...added]);
  };

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    if (!running) addFiles(e.dataTransfer.files);
  };

  const runRow = async (row: Row) => {
    patch(row.key, { stage: "thumbnail", error: undefined });
    try {
      const entry = await uploadPhoto(row.file, row.caption, password, (stage) =>
        patch(row.key, { stage }),
      );
      patch(row.key, { stage: "done" });
      onAdded(entry);
      setTimeout(() => removeRow(row.key), 1500);
    } catch (err) {
      patch(row.key, {
        stage: "error",
        error: err instanceof Error ? err.message : "Upload failed",
      });
    }
  };

  const runRows = async (targets: Row[]) => {
    setRunning(true);
    try {
      for (const row of targets) {
        await runRow(row);
      }
    } finally {
      setRunning(false);
    }
  };

  const uploadAll = () => runRows(rowsRef.current.filter((r) => r.stage === "queued"));

  const retry = (row: Row) => runRows([row]);

  const queuedCount = rows.filter((r) => r.stage === "queued").length;

  return (
    <section className="mb-10">
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-muted-foreground/40 rounded-lg p-8 text-center text-muted-foreground"
      >
        <p className="mb-3">Drop photos here (JPEG, PNG, WebP)</p>
        <Button variant="outline" disabled={running} onClick={() => fileInput.current?.click()}>
          Choose files
        </Button>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          disabled={running}
          onChange={onPick}
        />
      </div>

      {rows.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg shadow-md p-3"
            >
              <img src={row.previewUrl} alt="" className="w-16 h-16 object-cover rounded" />
              <Input
                value={row.caption}
                disabled={running}
                onChange={(e) => patch(row.key, { caption: e.target.value })}
                className="flex-1"
              />
              <span
                className={`text-sm w-40 shrink-0 ${
                  row.stage === "error" ? "text-red-500" : "text-muted-foreground"
                }`}
              >
                {row.stage === "error" ? row.error : STAGE_LABEL[row.stage]}
              </span>
              {row.stage === "error" && row.error !== UNSUPPORTED && (
                <Button size="sm" variant="outline" disabled={running} onClick={() => retry(row)}>
                  Retry
                </Button>
              )}
              {(row.stage === "queued" || row.stage === "error") && (
                <Button size="sm" variant="ghost" disabled={running} onClick={() => removeRow(row.key)}>
                  Remove
                </Button>
              )}
            </div>
          ))}
          <div>
            <Button disabled={running || queuedCount === 0} onClick={uploadAll}>
              {running ? "Uploading…" : "Upload all"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};

export default UploadQueue;
