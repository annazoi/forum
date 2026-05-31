import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Login } from './pages/login';
import { Register } from './pages/register';
import { Profile } from './pages/profile';
import { Layout } from './components/Layout';
import { Home } from './pages/home';
import { Post } from './pages/post';
import { Notifications } from './pages/notifications';
import { AnimatePresence, motion } from 'framer-motion';
import { themeStore } from './store/theme';

import { authStore } from './store/auth';

function AppContent() {
	const location = useLocation();
	const isLoggedIn = authStore((state) => state.isLoggedIn);

	const routes = (
		<AnimatePresence mode="wait">
			<motion.div
				key={location.pathname}
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -8 }}
				transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
			>
				<Routes location={location}>
					<Route path="/home" element={<Home />} />
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
					<Route path="/profile/:creatorId" element={<Profile />} />
					<Route path="/post/:postId" element={<Post />} />
					<Route path="/notifications" element={<Notifications />} />
					<Route path="/*" element={<Navigate to="/login" />} />
				</Routes>
			</motion.div>
		</AnimatePresence>
	);

	if (!isLoggedIn) {
		return routes;
	}

	return <Layout>{routes}</Layout>;
}

export const App = () => {
	const isDark = themeStore((s) => s.isDark);

	useEffect(() => {
		const root = document.documentElement;
		if (isDark) {
			root.classList.add('dark');
		} else {
			root.classList.remove('dark');
		}
	}, [isDark]);

	return (
		<div className="min-h-screen bg-surface dark:bg-void text-ink dark:text-cream font-body selection:bg-signal/20 dark:selection:bg-signal/30 selection:text-ink dark:selection:text-cream transition-colors duration-500 grain">
			<BrowserRouter>
				<AppContent />
			</BrowserRouter>
		</div>
	);
};
