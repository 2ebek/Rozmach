import { describe, expect, it } from "vitest";
import { ropsInnovations } from "./data/rops-biblioteka";
import { youtubeEmbed } from "./video";

describe("filmy o innowacjach (karta innowacji)", () => {
  it("zamienia linki YouTube na odtwarzacz bez ciasteczek, z czasem startu", () => {
    expect(youtubeEmbed("https://www.youtube.com/watch?v=o7UhDlebLJo")).toBe("https://www.youtube-nocookie.com/embed/o7UhDlebLJo");
    expect(youtubeEmbed("https://www.youtube.com/watch?v=BK6a8fjELR0&t=48s")).toBe("https://www.youtube-nocookie.com/embed/BK6a8fjELR0?start=48");
    expect(youtubeEmbed("https://youtu.be/o7UhDlebLJo")).toBe("https://www.youtube-nocookie.com/embed/o7UhDlebLJo");
    expect(youtubeEmbed("https://vimeo.com/123")).toBeNull();
    expect(youtubeEmbed("nie-adres")).toBeNull();
    expect(youtubeEmbed(undefined)).toBeNull();
  });

  it("linki do filmów w danych ROPS nie mają nieodkodowanych encji HTML", () => {
    for (const i of ropsInnovations) if (i.videoUrl) expect(i.videoUrl).not.toMatch(/&amp;|&#/);
  });
});
