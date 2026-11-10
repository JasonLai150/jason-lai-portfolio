import { describe, expect, it } from "vitest";
import { buildEntry, dedupeIds, extOf, isImageFile } from "../../scripts/migrate/lib";

describe("isImageFile", () => {
  it("accepts images case-insensitively", () => {
    expect(isImageFile("a.JPEG")).toBe(true);
  });
  it("rejects placeholders and non-images", () => {
    expect(isImageFile(".emptyFolderPlaceholder")).toBe(false);
    expect(isImageFile("notes.txt")).toBe(false);
  });
});

describe("extOf", () => {
  it("lowercases the extension", () => {
    expect(extOf("alaska, 2022.JPEG")).toBe("jpeg");
  });
});

describe("dedupeIds", () => {
  it("suffixes duplicate slugs in input order", () => {
    const files = [
      { name: "nyc, 2024.jpeg", contentType: "image/jpeg" },
      { name: "NYC 2024.jpeg", contentType: "image/jpeg" },
      { name: "nyc-2024.png", contentType: "image/png" },
    ];
    expect(dedupeIds(files).map((f) => f.id)).toEqual(["nyc-2024", "nyc-2024-2", "nyc-2024-3"]);
  });
});

describe("buildEntry", () => {
  it("builds a manifest entry", () => {
    expect(
      buildEntry({
        id: "alaska-2022",
        name: "alaska, 2022.jpeg",
        width: 4032,
        height: 3024,
        bytes: 3800000,
        now: new Date("2026-11-09T00:00:00Z"),
      }),
    ).toEqual({
      id: "alaska-2022",
      caption: "alaska, 2022",
      full: "full/alaska-2022.jpeg",
      thumb: "thumbs/alaska-2022.jpg",
      width: 4032,
      height: 3024,
      bytes: 3800000,
      createdAt: "2026-11-09T00:00:00.000Z",
    });
  });
});
