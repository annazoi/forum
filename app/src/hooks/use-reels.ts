import { useState, useCallback } from 'react';
import Axios from 'axios';
import { API_URL } from '../constants';
import { authStore } from '../store/auth';

interface CreateReelData {
	description?: string;
	video: Blob | File;
	visibility?: 'public' | 'private';
}

function toVideoFile(blob: Blob | File): File {
	if (blob instanceof File) return blob;
	const ext = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('quicktime') ? 'mov' : 'webm';
	const mime = blob.type || (ext === 'mp4' ? 'video/mp4' : 'video/webm');
	return new File([blob], `reel.${ext}`, { type: mime });
}

export const useReelsHook = () => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const token = authStore((state) => state.token);

	const getReels = useCallback(
		async (creatorId = '', page = 1) => {
			try {
				setLoading(true);
				let url = `${API_URL}posts/reels?page=${page}&limit=10`;
				if (creatorId) {
					url += `&creatorId=${creatorId}`;
				}
				const response = await Axios.get(url, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (response?.data?.reels) {
					return response.data.reels as any[];
				}
				return [];
			} catch {
				return [];
			} finally {
				setLoading(false);
			}
		},
		[token],
	);

	const createReel = useCallback(
		async (data: CreateReelData) => {
			try {
				setLoading(true);
				setError(null);

				const formData = new FormData();
				formData.append('video', toVideoFile(data.video));
				if (data.description) formData.append('description', data.description);
				formData.append('visibility', data.visibility || 'public');

				const response = await Axios.post(`${API_URL}posts/reels`, formData, {
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'multipart/form-data',
					},
					timeout: 120000,
				});
				return response.data;
			} catch (err: any) {
				const msg =
					err?.response?.data?.message ||
					(err?.code === 'ECONNABORTED' ? 'Upload timed out — try a shorter video' : 'Could not publish reel');
				setError(msg);
				throw new Error(msg);
			} finally {
				setLoading(false);
			}
		},
		[token],
	);

	return { getReels, createReel, loading, error };
};
