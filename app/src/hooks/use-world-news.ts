import { useCallback, useEffect, useState } from 'react';
import Axios from 'axios';
import { API_URL } from '../constants';

export interface WorldNewsItem {
	title: string;
	link: string;
	pubDate: string;
	source: string;
}

export const useWorldNews = () => {
	const [items, setItems] = useState<WorldNewsItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchHeadlines = useCallback(async () => {
		try {
			setError(null);
			const res = await Axios.get(`${API_URL}news/headlines`);
			setItems(res.data.items || []);
		} catch {
			setError('Could not load headlines');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchHeadlines();

		const interval = setInterval(fetchHeadlines, 15 * 60 * 1000);

		return () => clearInterval(interval);
	}, [fetchHeadlines]);

	return { items, loading, error, refresh: fetchHeadlines };
};
