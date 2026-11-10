import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminPing } from "@/lib/photosApi";

interface Props {
  onUnlocked: (password: string) => void;
}

const PasswordGate = ({ onUnlocked }: Props) => {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!value || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      if (await adminPing(value)) {
        onUnlocked(value);
      } else {
        setMessage("wrong password");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "request failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-sm mx-auto pt-32 px-4 flex flex-col gap-3">
      <Input
        type="password"
        placeholder="Password"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button type="submit" disabled={busy || !value}>
        {busy ? "Checking…" : "Unlock"}
      </Button>
      {message && <p className="text-sm text-red-500">{message}</p>}
    </form>
  );
};

export default PasswordGate;
