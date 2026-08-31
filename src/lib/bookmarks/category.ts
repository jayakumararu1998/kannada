import type { Story } from "@/lib/api/stories";

import { BOOKMARK_CATEGORIES, type BookmarkCategory } from "../api/public-client";

/** Story templates that are galleries (photo stories). */
const GALLERY_TEMPLATES = new Set(["photo", "photo-gallery", "gallery"]);
/** Story templates that are videos. */
const VIDEO_TEMPLATES = new Set(["video", "gumlet-video"]);

/**
 * Bucket a story into a bookmark category so the backend stores it separately:
 * VIDEOS for video stories, PHOTOS (gallery) for photo stories, NEWS otherwise.
 */
export function bookmarkCategoryForStory(story: Story): BookmarkCategory {
  const template = String(story?.["story-template"] || "text");
  if (VIDEO_TEMPLATES.has(template)) return BOOKMARK_CATEGORIES.VIDEOS;
  if (GALLERY_TEMPLATES.has(template)) return BOOKMARK_CATEGORIES.PHOTOS;
  return BOOKMARK_CATEGORIES.NEWS;
}
