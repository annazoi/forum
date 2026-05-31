import React, { createContext, useContext } from 'react';
import { useWorldNews } from '../hooks/use-world-news';

type WorldNewsContextValue = ReturnType<typeof useWorldNews>;

const WorldNewsContext = createContext<WorldNewsContextValue | null>(null);

export function WorldNewsProvider({ children }: { children: React.ReactNode }) {
	const value = useWorldNews();
	return <WorldNewsContext.Provider value={value}>{children}</WorldNewsContext.Provider>;
}

export function useWorldNewsContext() {
	const ctx = useContext(WorldNewsContext);
	if (!ctx) {
		throw new Error('useWorldNewsContext must be used within WorldNewsProvider');
	}
	return ctx;
}
