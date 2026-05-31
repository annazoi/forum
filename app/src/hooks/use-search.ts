import { useState, useCallback } from "react";
import Axios from "axios";
import { API_URL } from "../constants";
import { authStore } from "../store/auth";

export type SearchTab = "all" | "users" | "posts";

export interface SearchUser {
  _id: string;
  username: string;
  name: string;
  surname: string;
  image?: string;
  bio?: string;
  followers?: string[];
}

export interface SearchPost {
  _id: string;
  description: string;
  image?: string;
  date: string;
  likes: string[];
  comments: unknown[];
  creatorId: {
    _id: string;
    username: string;
    image?: string;
    name?: string;
    surname?: string;
  };
  visibility?: "public" | "private";
}

interface SearchResponse {
  users: SearchUser[];
  posts: SearchPost[];
}

export const useSearchHook = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = authStore((s) => s.token);

  const search = useCallback(
    async (query: string, tab: SearchTab = "all"): Promise<SearchResponse> => {
      const q = query.trim();
      if (q.length < 2) {
        return { users: [], posts: [] };
      }

      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      try {
        setLoading(true);
        setError(null);
        const type = tab === "all" ? "all" : tab;
        const res = await Axios.get<SearchResponse>(`${API_URL}search`, {
          params: { q, type },
          ...config,
        });
        return {
          users: res.data.users ?? [],
          posts: res.data.posts ?? [],
        };
      } catch {
        setError("Search failed. Try again.");
        return { users: [], posts: [] };
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  return { search, loading, error };
};
