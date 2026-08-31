/**
 * The lead video for a story, used to render it in the HERO (video templates)
 * and to skip the same element in the body so it isn't shown twice.
 *
 * Source order: story-level `embed-url` / `embed-js` first; otherwise the FIRST
 * `youtube-video` / `video` story-element. `elementKey` ("cardIdx_elementIdx")
 * is set only when the video came from a body element — the body renderer skips
 * that key when the hero is showing the video.
 */

export interface StoryVideo {
  embedUrl?: string;
  embedJs?: string;
  /** "ci_ei" of the body element the video came from (undefined for story-level). */
  elementKey?: string;
}

const VIDEO_ELEMENT_TYPES = new Set(["youtube-video", "video"]);

export function resolveStoryVideo(story: any): StoryVideo {
  if (story?.["embed-url"]) return { embedUrl: story["embed-url"] };
  if (story?.["embed-js"]) return { embedJs: story["embed-js"] };
  const cards = story?.cards ?? [];
  for (let ci = 0; ci < cards.length; ci++) {
    const els = cards[ci]?.["story-elements"] ?? [];
    for (let ei = 0; ei < els.length; ei++) {
      const el = els[ei];
      if (VIDEO_ELEMENT_TYPES.has(el?.type) && el?.["embed-url"]) {
        return { embedUrl: el["embed-url"], elementKey: `${ci}_${ei}` };
      }
    }
  }
  return {};
}
