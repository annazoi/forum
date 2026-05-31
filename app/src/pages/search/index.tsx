import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
	HiSearch,
	HiX,
	HiHashtag,
	HiUserGroup,
	HiDocumentText,
	HiClock,
	HiTrendingUp,
} from 'react-icons/hi';
import { authStore } from '../../store/auth';
import {
	useSearchHook,
	SearchTab,
	SearchUser,
	SearchPost,
} from '../../hooks/use-search';
import { usePostHook } from '../../hooks/use-posts';
import { useUserHook } from '../../hooks/use-user';
import { PostCard } from '../../components/PostCard';
import { LiveSignals } from '../../components/LiveSignals';
import { Spinner } from '../../components/ui/Spinner';
import { useMediaQuery } from '../../hooks/use-media-query';

const RECENT_KEY = 'relay-recent-searches';
const SUGGESTIONS = ['#relay', '#photography', '#travel', 'design', 'tech'];

const tabs: { id: SearchTab; label: string; icon: React.ElementType }[] = [
	{ id: 'all', label: 'Top', icon: HiTrendingUp },
	{ id: 'users', label: 'People', icon: HiUserGroup },
	{ id: 'posts', label: 'Posts', icon: HiDocumentText },
];

function loadRecent(): string[] {
	try {
		const raw = localStorage.getItem(RECENT_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function saveRecent(term: string) {
	const trimmed = term.trim();
	if (trimmed.length < 2) return;
	const prev = loadRecent().filter((t) => t.toLowerCase() !== trimmed.toLowerCase());
	const next = [trimmed, ...prev].slice(0, 8);
	localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

interface UserResultProps {
	user: SearchUser;
	index: number;
	currentUserId: string;
	onFollowChange: (id: string, following: boolean) => void;
}

const UserResult: React.FC<UserResultProps> = ({
	user,
	index,
	currentUserId,
	onFollowChange,
}) => {
	const { followUser, unfollowUser } = useUserHook();
	const isSelf = user._id === currentUserId;
	const [following, setFollowing] = useState(
		user.followers?.includes(currentUserId) ?? false
	);
	const [busy, setBusy] = useState(false);

	const handleFollow = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (isSelf || busy) return;
		setBusy(true);
		try {
			if (following) {
				await unfollowUser(user._id);
				setFollowing(false);
				onFollowChange(user._id, false);
			} else {
				await followUser(user._id);
				setFollowing(true);
				onFollowChange(user._id, true);
			}
		} finally {
			setBusy(false);
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.04, duration: 0.2 }}
		>
			<Link
				to={`/profile/${user._id}`}
				className="flex items-center gap-3.5 px-5 py-3.5 border-b border-border-subtle dark:border-void-border hover:bg-parchment-deep/40 dark:hover:bg-void-surface/50 transition-colors group"
			>
				<div className="w-12 h-12 rounded-xl bg-parchment-deep dark:bg-void-surface overflow-hidden border border-border-subtle dark:border-void-border shrink-0">
					{user.image ? (
						<img src={user.image} alt={user.username} className="w-full h-full object-cover" />
					) : (
						<div className="w-full h-full flex items-center justify-center font-display font-bold text-lg text-ink-faint dark:text-cream-faint">
							{user.username?.[0]?.toUpperCase()}
						</div>
					)}
				</div>

				<div className="flex-1 min-w-0">
					<p className="font-display font-semibold text-[15px] text-ink dark:text-cream truncate group-hover:text-relay transition-colors">
						{user.name} {user.surname}
					</p>
					<p className="font-mono text-[12px] text-ink-faint dark:text-cream-faint truncate">
						@{user.username}
					</p>
					{user.bio && (
						<p className="font-body text-[13px] text-ink-muted dark:text-cream-muted mt-1 line-clamp-1">
							{user.bio}
						</p>
					)}
				</div>

				{!isSelf && currentUserId && (
					<button
						onClick={handleFollow}
						disabled={busy}
						className={`shrink-0 px-4 py-1.5 rounded-lg font-display font-semibold text-xs transition-all ${
							following
								? 'border border-border dark:border-void-border text-ink-muted dark:text-cream-muted hover:border-relay/40 hover:text-relay'
								: 'bg-relay text-white hover:bg-relay-hover'
						}`}
					>
						{following ? 'Following' : 'Follow'}
					</button>
				)}
			</Link>
		</motion.div>
	);
};

export const Search: React.FC = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const initialQ = searchParams.get('q') ?? '';
	const initialTab = (searchParams.get('tab') as SearchTab) || 'all';

	const userId = authStore((s) => s.userId);
	const isLoggedIn = authStore((s) => s.isLoggedIn);

	const { search, loading, error } = useSearchHook();
	const { likePost, unlikePost } = usePostHook();

	const [query, setQuery] = useState(initialQ);
	const [activeTab, setActiveTab] = useState<SearchTab>(initialTab);
	const [users, setUsers] = useState<SearchUser[]>([]);
	const [posts, setPosts] = useState<SearchPost[]>([]);
	const [recent, setRecent] = useState<string[]>(loadRecent);
	const [hasSearched, setHasSearched] = useState(initialQ.length >= 2);

	const inputRef = useRef<HTMLInputElement>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isLgUp = useMediaQuery('(min-width: 1024px)');

	const runSearch = useCallback(
		async (q: string, tab: SearchTab) => {
			const trimmed = q.trim();
			if (trimmed.length < 2) {
				setUsers([]);
				setPosts([]);
				setHasSearched(false);
				return;
			}
			setHasSearched(true);
			const result = await search(trimmed, tab);
			setUsers(result.users);
			setPosts(result.posts as SearchPost[]);
			saveRecent(trimmed);
			setRecent(loadRecent());
		},
		[search]
	);

	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			const params = new URLSearchParams();
			const trimmed = query.trim();
			if (trimmed) params.set('q', trimmed);
			if (activeTab !== 'all') params.set('tab', activeTab);
			setSearchParams(params, { replace: true });
			runSearch(query, activeTab);
		}, 320);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [query, activeTab, runSearch, setSearchParams]);

	const displayUsers = useMemo(() => {
		if (activeTab === 'posts') return [];
		return users;
	}, [users, activeTab]);

	const displayPosts = useMemo(() => {
		if (activeTab === 'users') return [];
		return posts;
	}, [posts, activeTab]);

	const totalResults = displayUsers.length + displayPosts.length;
	const showEmpty = hasSearched && !loading && totalResults === 0 && query.trim().length >= 2;
	const showIdle = !hasSearched || query.trim().length < 2;

	const applyQuery = (term: string) => {
		setQuery(term);
		inputRef.current?.focus();
	};

	const clearQuery = () => {
		setQuery('');
		setUsers([]);
		setPosts([]);
		setHasSearched(false);
		setSearchParams({}, { replace: true });
		inputRef.current?.focus();
	};

	const removeRecent = (term: string, e: React.MouseEvent) => {
		e.stopPropagation();
		const next = recent.filter((t) => t !== term);
		localStorage.setItem(RECENT_KEY, JSON.stringify(next));
		setRecent(next);
	};

	const handlePostDeleted = (postId: string) => {
		setPosts((prev) => prev.filter((post) => post._id !== postId));
	};

	const handlePostUpdated = (updated: SearchPost) => {
		setPosts((prev) => prev.map((post) => (post._id === updated._id ? { ...post, ...updated } : post)));
	};

	if (!isLoggedIn) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8">
				<div className="w-20 h-20 bg-relay/10 dark:bg-relay/20 rounded-2xl flex items-center justify-center mb-6">
					<HiSearch className="w-10 h-10 text-relay" />
				</div>
				<h2 className="font-display font-bold text-2xl text-ink dark:text-cream mb-3">Sign in to search</h2>
				<p className="text-ink-muted dark:text-cream-muted max-w-xs mx-auto leading-relaxed">
					Find people, posts, and hashtags across Relay.
				</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-surface dark:bg-void transition-colors">
			<div className="sticky top-0 z-40 bg-surface/85 dark:bg-void/85 backdrop-blur-xl border-b border-border-subtle dark:border-void-border">
				<div className="px-4 py-3">
					<div className="relative">
						<HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-faint dark:text-cream-faint pointer-events-none" />
						<input
							ref={inputRef}
							type="search"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search people, posts, or #hashtags"
							autoFocus
							className="w-full pl-11 pr-10 py-3 bg-parchment-deep/50 dark:bg-void-surface border border-border-subtle dark:border-void-border rounded-xl text-[15px] text-ink dark:text-cream font-body placeholder:text-ink-faint/70 dark:placeholder:text-cream-faint/70 focus:outline-none focus:ring-2 focus:ring-relay/25 focus:border-relay/40 transition-all"
						/>
						{query && (
							<button
								type="button"
								onClick={clearQuery}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-surface dark:hover:bg-void text-ink-faint dark:text-cream-faint hover:text-ink dark:hover:text-cream transition-colors"
								aria-label="Clear search"
							>
								<HiX className="w-4 h-4" />
							</button>
						)}
					</div>
				</div>

				<AnimatePresence>
					{hasSearched && query.trim().length >= 2 && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							className="px-4 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-border-subtle dark:border-void-border"
						>
							{tabs.map((tab) => {
								const Icon = tab.icon;
								const active = activeTab === tab.id;
								return (
									<button
										key={tab.id}
										onClick={() => setActiveTab(tab.id)}
										className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-display font-semibold text-xs transition-all whitespace-nowrap ${
											active
												? 'bg-ink text-cream dark:bg-cream dark:text-ink'
												: 'text-ink-muted dark:text-cream-muted hover:bg-parchment-deep/60 dark:hover:bg-void-surface'
										}`}
									>
										<Icon className="w-3.5 h-3.5" />
										{tab.label}
									</button>
								);
							})}
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{!isLgUp && (
				<div className="border-b border-border-subtle dark:border-void-border">
					<LiveSignals variant="carousel" />
				</div>
			)}

			<div className="pb-16">
				{showIdle && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="px-5 pt-6"
					>
						{recent.length > 0 && (
							<section className="mb-8">
								<div className="flex items-center gap-2 mb-3">
									<HiClock className="w-4 h-4 text-ink-faint dark:text-cream-faint" />
									<h2 className="font-mono text-[10px] text-ink-faint dark:text-cream-faint uppercase tracking-widest">
										Recent
									</h2>
								</div>
								<ul className="flex flex-col gap-0.5">
									{recent.map((term) => (
										<li key={term}>
											<button
												type="button"
												onClick={() => applyQuery(term)}
												className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-parchment-deep/50 dark:hover:bg-void-surface/60 transition-colors text-left group"
											>
												<span className="flex items-center gap-3 min-w-0">
													<HiSearch className="w-4 h-4 text-ink-faint dark:text-cream-faint shrink-0" />
													<span className="font-body text-[15px] text-ink dark:text-cream truncate">
														{term}
													</span>
												</span>
												<span
													role="button"
													tabIndex={0}
													onClick={(e) => removeRecent(term, e)}
													onKeyDown={(e) => e.key === 'Enter' && removeRecent(term, e as unknown as React.MouseEvent)}
													className="p-1 rounded-md opacity-0 group-hover:opacity-100 text-ink-faint hover:text-relay transition-all"
													aria-label={`Remove ${term}`}
												>
													<HiX className="w-3.5 h-3.5" />
												</span>
											</button>
										</li>
									))}
								</ul>
							</section>
						)}

						<section>
							<div className="flex items-center gap-2 mb-3">
								<HiTrendingUp className="w-4 h-4 text-signal" />
								<h2 className="font-mono text-[10px] text-ink-faint dark:text-cream-faint uppercase tracking-widest">
									Try searching
								</h2>
							</div>
							<div className="flex flex-wrap gap-2">
								{SUGGESTIONS.map((s) => (
									<button
										key={s}
										type="button"
										onClick={() => applyQuery(s)}
										className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-parchment-deep/60 dark:bg-void-surface border border-border-subtle dark:border-void-border font-display font-semibold text-sm text-ink dark:text-cream hover:border-relay/40 hover:text-relay transition-all"
									>
										{s.startsWith('#') ? (
											<HiHashtag className="w-3.5 h-3.5 text-signal" />
										) : (
											<HiSearch className="w-3.5 h-3.5 text-ink-faint" />
										)}
										{s}
									</button>
								))}
							</div>
						</section>
					</motion.div>
				)}

				{loading && hasSearched && (
					<div className="flex flex-col items-center justify-center py-24 gap-4">
						<Spinner loading={loading} />
						<p className="font-mono text-[11px] text-ink-faint dark:text-cream-faint uppercase tracking-wider animate-pulse">
							Searching...
						</p>
					</div>
				)}

				{error && (
					<p className="px-5 py-4 font-mono text-[11px] text-relay uppercase tracking-wider text-center">
						{error}
					</p>
				)}

				{showEmpty && (
					<motion.div
						initial={{ opacity: 0, scale: 0.98 }}
						animate={{ opacity: 1, scale: 1 }}
						className="flex flex-col items-center justify-center py-32 text-center px-8"
					>
						<div className="w-16 h-16 bg-parchment-deep/50 dark:bg-void-surface/50 rounded-2xl flex items-center justify-center mb-5 border border-border-subtle dark:border-void-border">
							<HiSearch className="w-8 h-8 text-ink-faint dark:text-cream-faint" />
						</div>
						<h3 className="font-display font-bold text-lg text-ink dark:text-cream mb-2">
							No results for &ldquo;{query.trim()}&rdquo;
						</h3>
						<p className="text-ink-muted dark:text-cream-muted text-sm max-w-[260px] leading-relaxed">
							Try a different spelling, search by @username, or use a hashtag like #travel.
						</p>
					</motion.div>
				)}

				{!loading && hasSearched && !showEmpty && query.trim().length >= 2 && (
					<div>
						{displayUsers.length > 0 && (
							<section>
								{activeTab === 'all' && (
									<div className="px-5 py-3 border-b border-border-subtle dark:border-void-border">
										<h2 className="font-mono text-[10px] text-ink-faint dark:text-cream-faint uppercase tracking-widest">
											People
										</h2>
									</div>
								)}
								{displayUsers.map((u, i) => (
									<UserResult
										key={u._id}
										user={u}
										index={i}
										currentUserId={userId}
										onFollowChange={() => {}}
									/>
								))}
							</section>
						)}

						{displayPosts.length > 0 && (
							<section>
								{activeTab === 'all' && displayUsers.length > 0 && (
									<div className="px-5 py-3 border-b border-t border-border-subtle dark:border-void-border">
										<h2 className="font-mono text-[10px] text-ink-faint dark:text-cream-faint uppercase tracking-widest">
											Posts
										</h2>
									</div>
								)}
								{displayPosts.map((post) => (
									<PostCard
										key={post._id}
										post={post}
										onLike={likePost}
										onUnlike={unlikePost}
										onDeleted={handlePostDeleted}
										onUpdated={handlePostUpdated}
									/>
								))}
							</section>
						)}
					</div>
				)}
			</div>
		</div>
	);
};
