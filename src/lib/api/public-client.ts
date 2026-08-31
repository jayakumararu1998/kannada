/**
 * Public API client for the shared bookmark/auth backend (same service dinamani
 * uses — `NEXT_PUBLIC_API_BASE_URL`, default `/api/public`). Stores the auth
 * token in localStorage and attaches it as a Bearer header automatically.
 */

const PUBLIC_AUTH_TOKEN_KEY = "public_auth_token";

/**
 * Bookmark buckets. The backend validates the `category` VALUE against a fixed
 * list (from `/bookmarks/available-categories`) — these exact strings — so the
 * three "video / news / gallery" buckets map to VIDEOS / NEWS / PHOTOS.
 */
export const BOOKMARK_CATEGORIES = {
  NEWS: "செய்தி",
  ARTICLES: "கட்டுரைகள்",
  PHOTOS: "புகைப்படங்கள்",
  VIDEOS: "வீடியோக்கள்",
} as const;

export type BookmarkCategory =
  (typeof BOOKMARK_CATEGORIES)[keyof typeof BOOKMARK_CATEGORIES];

/** Human labels for each bucket (for a future "saved" page). */
export const CATEGORY_LABELS: Record<string, string> = {
  [BOOKMARK_CATEGORIES.NEWS]: "News",
  [BOOKMARK_CATEGORIES.ARTICLES]: "Articles",
  [BOOKMARK_CATEGORIES.PHOTOS]: "Gallery",
  [BOOKMARK_CATEGORIES.VIDEOS]: "Videos",
};

export interface Bookmark {
  id: string;
  user_id: string;
  slug: string;
  category: BookmarkCategory;
  title?: string;
  thumbnail_url?: string;
  description?: string;
  article_url?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface BookmarkInput {
  slug: string;
  category?: BookmarkCategory;
  title?: string;
  thumbnail_url?: string;
  description?: string;
  article_url?: string;
  metadata?: Record<string, unknown>;
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

class PublicApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/public";
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(PUBLIC_AUTH_TOKEN_KEY);
  }
  setToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(PUBLIC_AUTH_TOKEN_KEY, token);
  }
  removeToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(PUBLIC_AUTH_TOKEN_KEY);
  }
  hasToken(): boolean {
    return !!this.getToken();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ApiError(
        (data as { message?: string })?.message || "Request failed",
        response.status,
        data,
      );
    }
    return data as T;
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }
  post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }
  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

const publicApiClient = new PublicApiClient();
export default publicApiClient;

// ── Bookmarks API ────────────────────────────────────────────────────────────

export const bookmarksApi = {
  /** All bookmarks (optionally filtered by category). Requires auth. */
  getBookmarks(options?: {
    category?: BookmarkCategory;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    bookmarks: Bookmark[];
    pagination?: unknown;
  }> {
    const p = new URLSearchParams();
    if (options?.category) p.set("category", options.category);
    if (options?.page) p.set("page", String(options.page));
    if (options?.limit) p.set("limit", String(options.limit));
    const qs = p.toString();
    return publicApiClient.get(`/bookmarks${qs ? `?${qs}` : ""}`);
  },

  /** Add-if-absent / remove-if-present. Requires auth. */
  toggleBookmark(data: BookmarkInput): Promise<{
    success: boolean;
    message: string;
    bookmarked: boolean;
    category: string | null;
    bookmark?: Bookmark;
  }> {
    return publicApiClient.post("/bookmarks/toggle", data);
  },

  removeBookmark(slug: string): Promise<{ success: boolean; message: string }> {
    return publicApiClient.delete(`/bookmarks/${encodeURIComponent(slug)}`);
  },

  isBookmarked(
    slug: string,
  ): Promise<{ success: boolean; slug: string; bookmarked: boolean }> {
    return publicApiClient.get(`/bookmarks/${encodeURIComponent(slug)}`);
  },

  /** Per-category counts (for a saved-articles page). */
  getCategories(): Promise<{
    success: boolean;
    categories: { category: string; count: number }[];
  }> {
    return publicApiClient.get(`/bookmarks/categories`);
  },
};
