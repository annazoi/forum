import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authStore } from '../../store/auth';
import { themeStore } from '../../store/theme';
import { HiHome, HiSearch, HiPlus, HiBell, HiUser, HiOutlineLogout, HiMoon, HiSun, HiFilm } from 'react-icons/hi';
import { motion } from 'framer-motion';
import { useNotificationsHook } from '../../hooks/use-notifications';
import { useMediaQuery } from '../../hooks/use-media-query';
import { WorldNewsProvider } from '../../providers/world-news';
import { LiveSignals } from '../LiveSignals';

interface NavItemProps {
	to?: string;
	icon: React.ElementType;
	label: string;
	onClick?: () => void;
	isActive?: boolean;
	badge?: number;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, onClick, isActive, badge }) => {
	const content = (
		<motion.div
			whileHover={{ x: 3 }}
			whileTap={{ scale: 0.97 }}
			className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all duration-200 relative ${
				isActive
					? 'font-display font-semibold text-relay bg-relay/8 dark:bg-relay/12'
					: 'text-ink-muted dark:text-cream-muted hover:bg-parchment-deep/60 dark:hover:bg-void-surface hover:text-ink dark:hover:text-cream'
			}`}
		>
			{isActive && (
				<motion.div
					layoutId="nav-signal"
					className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-signal rounded-r-full signal-glow"
				/>
			)}
			<div className="relative ml-0.5">
				<Icon className={`w-[22px] h-[22px] ${isActive ? 'stroke-[2px]' : ''}`} />
				{badge !== undefined && badge > 0 && (
					<motion.span
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] bg-relay text-white text-[9px] font-mono font-medium rounded-full flex items-center justify-center px-0.5 ring-2 ring-surface dark:ring-void"
					>
						{badge > 9 ? '9+' : badge}
					</motion.span>
				)}
			</div>
			<span className="text-[15px] hidden xl:block tracking-tight">{label}</span>
		</motion.div>
	);

	if (to) {
		return (
			<Link to={to} className="w-full xl:w-auto relative">
				{content}
			</Link>
		);
	}

	return (
		<button onClick={onClick} className="w-full text-left relative">
			{content}
		</button>
	);
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { pathname } = useLocation();
	const navigate = useNavigate();

	const isLoggedIn = authStore((state) => state.isLoggedIn);
	const userId = authStore((state) => state.userId);
	const logOut = authStore((state) => state.logOut);

	const isDark = themeStore((s) => s.isDark);
	const toggleTheme = themeStore((s) => s.toggle);

	const { unreadCount, fetchUnreadCount } = useNotificationsHook();
	const isLgUp = useMediaQuery('(min-width: 1024px)');

	useEffect(() => {
		if (!isLoggedIn) return;

		fetchUnreadCount();

		const interval = setInterval(fetchUnreadCount, 30000);

		return () => clearInterval(interval);
	}, [isLoggedIn, fetchUnreadCount]);

	const handleLogout = () => {
		logOut();
		navigate('/login');
	};

	const navItems = [
		{ to: '/home', icon: HiHome, label: 'Feed', protected: true },
		{ to: '/reels', icon: HiFilm, label: 'Reels', protected: true },
		{ to: '/search', icon: HiSearch, label: 'Search', protected: true },
		{ to: '/notifications', icon: HiBell, label: 'Signals', badge: unreadCount, protected: true },
		{ to: `/profile/${userId}`, icon: HiUser, label: 'Profile', protected: true },
	];

	const pageTitle =
		pathname === '/home'
			? 'Feed'
			: pathname === '/reels'
				? 'Reels'
			: pathname === '/search'
				? 'Search'
			: pathname === '/notifications'
				? 'Signals'
				: pathname.startsWith('/profile')
					? 'Profile'
					: pathname.startsWith('/post')
						? 'Thread'
						: pathname.split('/')[1]?.charAt(0).toUpperCase() + pathname.split('/')[1]?.slice(1);

	return (
		<WorldNewsProvider>
		<div className="min-h-screen relative z-[1]">
			<div className="max-w-7xl mx-auto flex h-full">
				{isLoggedIn && (
					<aside className="hidden sm:flex flex-col sticky top-0 h-screen w-[72px] xl:w-56 border-r border-border-subtle dark:border-void-border px-2 py-5 gap-1">
						<Link to="/home" className="mb-6 px-2 block group">
							<div className="flex items-center gap-2.5">
								<img
									src="/relay.png"
									alt="Relay"
									className="h-9 w-auto max-w-[4.5rem] rounded-md object-contain relay-glow group-hover:scale-105 transition-transform duration-300"
								/>
								<span className="hidden xl:block font-display font-extrabold text-lg text-ink dark:text-cream tracking-tight">
									Relay
								</span>
							</div>
						</Link>

						<div className="flex flex-col gap-0.5 flex-1">
							{navItems.map((item) => {
								if ('protected' in item && item.protected && !isLoggedIn) return null;
								return (
									<NavItem
										key={item.label}
										to={item.to}
										icon={item.icon}
										label={item.label}
										isActive={pathname === item.to || (item.to === '/reels' && pathname.startsWith('/reels'))}
										badge={'badge' in item ? item.badge : undefined}
									/>
								);
							})}

							<NavItem icon={HiOutlineLogout} label="Sign out" onClick={handleLogout} />

							<button
								onClick={toggleTheme}
								className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all duration-200 text-ink-muted dark:text-cream-muted hover:bg-parchment-deep/60 dark:hover:bg-void-surface hover:text-ink dark:hover:text-cream w-full text-left mt-1"
							>
								{isDark ? (
									<HiSun className="w-[22px] h-[22px] text-signal" />
								) : (
									<HiMoon className="w-[22px] h-[22px]" />
								)}
								<span className="text-[15px] hidden xl:block tracking-tight">
									{isDark ? 'Light' : 'Dark'}
								</span>
							</button>
						</div>

						<motion.button
							whileHover={{ scale: 1.02, y: -1 }}
							whileTap={{ scale: 0.98 }}
							className="mt-2 bg-relay text-white rounded-xl py-3 px-3 xl:px-5 font-display font-semibold hover:bg-relay-hover transition-all text-sm relay-glow"
						>
							<span className="hidden xl:inline">Compose</span>
							<HiPlus className="xl:hidden w-5 h-5 mx-auto" />
						</motion.button>
					</aside>
				)}

				<main className="flex-1 w-full max-w-2xl border-r border-border-subtle dark:border-void-border pb-20 sm:pb-0 min-h-screen">
					<header className="sticky top-0 z-40 bg-surface/85 dark:bg-void/85 backdrop-blur-xl border-b border-border-subtle dark:border-void-border px-5 h-[52px] flex items-center justify-between">
						<motion.h1
							initial={{ opacity: 0, x: -8 }}
							animate={{ opacity: 1, x: 0 }}
							key={pathname}
							className="text-[17px] font-display font-bold tracking-tight text-ink dark:text-cream"
						>
							{pageTitle}
						</motion.h1>

						<button
							onClick={toggleTheme}
							className="sm:hidden p-2 rounded-lg hover:bg-parchment-deep/60 dark:hover:bg-void-surface transition-colors"
						>
							{isDark ? (
								<HiSun className="w-[18px] h-[18px] text-signal" />
							) : (
								<HiMoon className="w-[18px] h-[18px] text-ink-muted" />
							)}
						</button>
					</header>
					{children}
				</main>

				{isLgUp && (
					<aside className="w-72 p-5">
						<LiveSignals />
					</aside>
				)}
			</div>

			{isLoggedIn && (
				<nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-surface/90 dark:bg-void/90 backdrop-blur-xl border-t border-border-subtle dark:border-void-border px-4 h-[68px] flex items-center justify-around z-50">
					{navItems.map((item) => {
						if ('protected' in item && item.protected && !isLoggedIn) return null;
						const Icon = item.icon;
						const isActive = pathname === item.to || (item.to === '/reels' && pathname.startsWith('/reels'));
						const badge = 'badge' in item ? item.badge : undefined;
						return (
							<Link key={item.label} to={item.to} className="relative p-2">
								<motion.div
									whileTap={{ scale: 0.85 }}
									className={isActive ? 'text-relay' : 'text-ink-faint dark:text-cream-faint'}
								>
									<div className="relative">
										<Icon className={`w-[22px] h-[22px] ${isActive ? 'stroke-[2px]' : ''}`} />
										{badge !== undefined && badge > 0 && (
											<span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-relay text-white text-[8px] font-mono rounded-full flex items-center justify-center px-0.5 ring-2 ring-surface dark:ring-void">
												{badge > 9 ? '9+' : badge}
											</span>
										)}
									</div>
								</motion.div>
								{isActive && (
									<motion.div
										layoutId="mobile-signal"
										className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-signal rounded-full signal-glow"
									/>
								)}
							</Link>
						);
					})}
					<button onClick={toggleTheme} className="p-2 text-ink-faint dark:text-cream-faint">
						{isDark ? (
							<HiSun className="w-[22px] h-[22px] text-signal" />
						) : (
							<HiMoon className="w-[22px] h-[22px]" />
						)}
					</button>
					<motion.button
						whileTap={{ scale: 0.9 }}
						className="w-12 h-12 bg-relay rounded-xl flex items-center justify-center text-white -mt-6 border-[3px] border-surface dark:border-void relay-glow"
					>
						<HiPlus className="w-5 h-5" />
					</motion.button>
				</nav>
			)}
		</div>
		</WorldNewsProvider>
	);
};
