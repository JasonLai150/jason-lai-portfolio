import { describe, it, expect } from "vitest";
import {
  ID_NEW,
  PhotoError,
  IMMUTABLE_CACHE,
  MANIFEST_CACHE,
  addPhoto,
  captionFromFilename,
  emptyManifest,
  extForContentType,
  fullPath,
  isValidId,
  isValidNewId,
  newId,
  normalizeCaption,
  photoUrl,
  removePhoto,
  setCaption,
  slugId,
  sortPhotos,
  thumbPath,
  toPhotos,
  type PhotoEntry,
} from "../../src/lib/photos";

const entry = (id: string, caption = id): PhotoEntry => ({
  id,
  caption,
  full: `full/${id}.jpg`,
  thumb: `thumbs/${id}.jpg`,
  width: 10,
  height: 20,
  bytes: 30,
  createdAt: "2026-01-01T00:00:00.000Z",
});
const now = new Date("2026-02-03T04:05:06.000Z");

describe("cache constants", () => {
  it("have exact values", () => {
    expect(IMMUTABLE_CACHE).toBe("public, max-age=31536000, immutable");
    expect(MANIFEST_CACHE).toBe("no-cache");
  });
});

describe("isValidId", () => {
  it("accepts alaska-2022", () => expect(isValidId("alaska-2022")).toBe(true));
  it("accepts k3j9d02mfa", () => expect(isValidId("k3j9d02mfa")).toBe(true));
  it("accepts a", () => expect(isValidId("a")).toBe(true));
  it("accepts 64 a's", () => expect(isValidId("a".repeat(64))).toBe(true));
  it("rejects empty", () => expect(isValidId("")).toBe(false));
  it("rejects uppercase", () => expect(isValidId("Alaska")).toBe(false));
  it("rejects a/b", () => expect(isValidId("a/b")).toBe(false));
  it("rejects ../x", () => expect(isValidId("../x")).toBe(false));
  it("rejects 65 a's", () => expect(isValidId("a".repeat(65))).toBe(false));
  it("rejects number", () => expect(isValidId(42)).toBe(false));
  it("rejects undefined", () => expect(isValidId(undefined)).toBe(false));
});

describe("isValidNewId", () => {
  it("accepts k3j9d02mfa", () => expect(isValidNewId("k3j9d02mfa")).toBe(true));
  it("rejects alaska-2022", () => expect(isValidNewId("alaska-2022")).toBe(false));
  it("rejects abc", () => expect(isValidNewId("abc")).toBe(false));
  it("rejects 17 a's", () => expect(isValidNewId("a".repeat(17))).toBe(false));
});

describe("newId", () => {
  it("matches ID_NEW", () => expect(newId()).toMatch(ID_NEW));
  it("has length 10", () => expect(newId()).toHaveLength(10));
  it("differs between calls", () => expect(newId()).not.toBe(newId()));
});

describe("slugId", () => {
  it("slugs commas and spaces", () => expect(slugId("alaska, 2022.jpeg")).toBe("alaska-2022"));
  it("slugs non-ascii letters", () => expect(slugId("Café Niño, 2024.JPEG")).toBe("caf-ni-o-2024"));
  it("falls back to photo", () => expect(slugId("日本.jpeg")).toBe("photo"));
  it("cuts to 64", () => expect(slugId("a".repeat(80) + ".jpg")).toHaveLength(64));
});

describe("captionFromFilename", () => {
  it("strips extension", () => expect(captionFromFilename("alaska, 2022.jpeg")).toBe("alaska, 2022"));
  it("strips last extension only", () => expect(captionFromFilename("v1.2 beach.png")).toBe("v1.2 beach"));
});

describe("normalizeCaption", () => {
  it("trims", () => expect(normalizeCaption("  hi  ")).toBe("hi"));
  it("null for blank", () => expect(normalizeCaption("   ")).toBeNull());
  it("null for 201 chars", () => expect(normalizeCaption("x".repeat(201))).toBeNull());
  it("accepts 200 chars", () => expect(normalizeCaption("x".repeat(200))).not.toBeNull());
  it("null for non-string", () => expect(normalizeCaption(5)).toBeNull());
});

describe("extForContentType", () => {
  it("maps jpeg", () => expect(extForContentType("image/jpeg")).toBe("jpg"));
  it("null for heic", () => expect(extForContentType("image/heic")).toBeNull());
});

describe("paths", () => {
  it("fullPath", () => expect(fullPath("abc", "jpeg")).toBe("full/abc.jpeg"));
  it("thumbPath", () => expect(thumbPath("abc")).toBe("thumbs/abc.jpg"));
  it("photoUrl", () => expect(photoUrl("https://s/b", "full/abc.jpeg")).toBe("https://s/b/full/abc.jpeg"));
});

describe("sortPhotos", () => {
  const input = [entry("1", "Zoo"), entry("2", "alaska"), entry("3", "Bobby")];
  it("orders by caption ignoring case", () =>
    expect(sortPhotos(input).map((p) => p.caption)).toEqual(["alaska", "Bobby", "Zoo"]));
  it("does not mutate input", () => {
    sortPhotos(input);
    expect(input.map((p) => p.caption)).toEqual(["Zoo", "alaska", "Bobby"]);
  });
});

describe("toPhotos", () => {
  it("maps entries", () => {
    const m = { ...emptyManifest(now), photos: [entry("abc", "Hi")] };
    expect(toPhotos(m, "https://s/b")).toEqual([
      { name: "abc", url: "https://s/b/full/abc.jpg", thumbnailUrl: "https://s/b/thumbs/abc.jpg", caption: "Hi" },
    ]);
  });
});

describe("addPhoto", () => {
  const m = { ...emptyManifest(now), photos: [entry("a")] };
  it("appends and sets updatedAt", () => {
    const next = addPhoto(m, entry("b"), now);
    expect(next.photos.map((p) => p.id)).toEqual(["a", "b"]);
    expect(next.updatedAt).toBe(now.toISOString());
  });
  it("throws 409 on duplicate", () => {
    try {
      addPhoto(m, entry("a"), now);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(PhotoError);
      expect((e as PhotoError).status).toBe(409);
    }
  });
  it("leaves input unchanged", () => {
    addPhoto(m, entry("b"), now);
    expect(m.photos).toHaveLength(1);
  });
});

describe("setCaption", () => {
  const m = { ...emptyManifest(now), photos: [entry("a"), entry("b")] };
  it("changes only that entry", () => {
    const next = setCaption(m, "a", "New", now);
    expect(next.photos[0].caption).toBe("New");
    expect(next.photos[1]).toEqual(m.photos[1]);
    expect(next.updatedAt).toBe(now.toISOString());
  });
  it("throws 404 on unknown id", () => {
    expect(() => setCaption(m, "zz", "x", now)).toThrow(expect.objectContaining({ status: 404 }));
  });
});

describe("removePhoto", () => {
  const m = { ...emptyManifest(now), photos: [entry("a"), entry("b")] };
  it("returns removed entry and new manifest", () => {
    const r = removePhoto(m, "a", now);
    expect(r.removed.id).toBe("a");
    expect(r.manifest.photos.map((p) => p.id)).toEqual(["b"]);
  });
  it("throws 404 on unknown id", () => {
    expect(() => removePhoto(m, "zz", now)).toThrow(expect.objectContaining({ status: 404 }));
  });
});
