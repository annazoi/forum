import { useState, useCallback } from "react";
import { API_URL } from "../constants";
import Axios from "axios";
import { authStore } from "../store/auth";

interface CreatePostData {
  description?: string;
  image?: string;
  visibility?: "public" | "private";
}

interface UpdatePostData {
  description?: string;
  visibility?: "public" | "private";
}

interface CommentData {
  description: string;
}

export const usePostHook = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = authStore((state) => state.token);

  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const createPost = useCallback(async (data: CreatePostData) => {
    try {
      setLoading(true);
      const response = await Axios.post(`${API_URL}posts`, data, config);
      return response.data;
    } catch (err) {
      setError("Could not create post");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const getPosts = useCallback(async (creatorId = "", page = 1) => {
    try {
      setLoading(true);
      let url = `${API_URL}posts?page=${page}&limit=10`;
      if (creatorId) {
        url = url + `&creatorId=${creatorId}`;
      }
      const response = await Axios.get(url, config);
      if (response?.data?.posts) {
        return response.data.posts as any[];
      }
      return [];
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const likePost = useCallback(async (postId: string) => {
    try {
      await Axios.post(`${API_URL}posts/${postId}/like`, {}, config);
    } catch {
      setError("Could not like post");
    }
  }, [token]);

  const unlikePost = useCallback(async (postId: string) => {
    try {
      await Axios.post(`${API_URL}posts/${postId}/unlike`, {}, config);
    } catch {
      setError("Could not unlike post");
    }
  }, [token]);

  const getPost = useCallback(async (postId: string) => {
    try {
      setLoading(true);
      const response = await Axios.get(`${API_URL}posts/${postId}`, config);
      if (response?.data?.post) {
        return response.data.post;
      }
      return null;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    try {
      const response = await Axios.delete(`${API_URL}posts/${postId}`, config);
      return { deleted: response?.data?.deletedCount === 1 };
    } catch {
      return { deleted: false };
    }
  }, [token]);

  const updatePost = useCallback(async (postId: string, data: UpdatePostData) => {
    try {
      setLoading(true);
      const response = await Axios.put(`${API_URL}posts/${postId}`, data, config);
      return response.data?.post ?? null;
    } catch {
      setError("Could not update post");
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createComment = useCallback(async (data: CommentData, postId: string) => {
    try {
      setLoading(true);
      const response = await Axios.post(`${API_URL}posts/${postId}/comments`, data, config);
      return { message: "ok", data: response.data };
    } catch {
      return { message: "Could not create Comment", data: null };
    } finally {
      setLoading(false);
    }
  }, [token]);

  return {
    createPost,
    getPosts,
    getPost,
    deletePost,
    updatePost,
    createComment,
    likePost,
    unlikePost,
    loading,
    error,
  };
};
