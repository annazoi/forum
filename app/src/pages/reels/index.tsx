import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiFilm, HiPlus } from 'react-icons/hi';
import { useReelsHook } from '../../hooks/use-reels';
import { usePostHook } from '../../hooks/use-posts';
import { authStore } from '../../store/auth';
import { ReelCard } from '../../components/ReelCard';
import { ReelEditor } from '../../components/ReelEditor';
import { Spinner } from '../../components/ui/Spinner';
import { notify } from '../../utils/toast';

type ReelsView = 'browse' | 'create';

export const Reels: React.FC = () => {
	const userId = authStore((state) => state.userId);
	const { getReels, createReel, loading } = useReelsHook();
	const { likePost, unlikePost } = usePostHook();

	const [view, setView] = useState<ReelsView>('browse');
	const [reels, setReels] = useState<any[]>([]);
	const [hasMore, setHasMore] = useState(true);
	const [visibility, setVisibility] = useState<'public' | 'private'>('public');
	const pageRef = useRef(1);

	const fetchReels = useCallback(
		async (pageNum: number, isInitial = false) => {
			try {
				const newReels = await getReels('', pageNum);
				if (newReels && Array.isArray(newReels)) {
					if (newReels.length < 10) setHasMore(false);
					if (isInitial) {
						setReels(newReels);
					} else {
						setReels((prev) => [...prev, ...newReels]);
					}
				} else {
					setHasMore(false);
				}
			} catch {
				setHasMore(false);
			}
		},
		[getReels],
	);

	useEffect(() => {
		if (view === 'browse') {
			pageRef.current = 1;
			fetchReels(1, true);
			setHasMore(true);
		}
	}, [view, fetchReels]);

	const handleScroll = useCallback(() => {
		const container = document.getElementById('reels-scroll');
		if (!container || loading || !hasMore) return;

		if (container.scrollTop + container.clientHeight >= container.scrollHeight - 80) {
			pageRef.current += 1;
			fetchReels(pageRef.current);
		}
	}, [loading, hasMore, fetchReels]);

	const handleLike = async (reelId: string) => {
		if (!userId) return;
		setReels((prev) =>
			prev.map((reel) => {
				if (reel._id !== reelId) return reel;
				if (reel.likes.includes(userId)) return reel;
				return { ...reel, likes: [...reel.likes, userId] };
			}),
		);
		try {
			await likePost(reelId);
		} catch {
			fetchReels(1, true);
		}
	};

	const handleUnlike = async (reelId: string) => {
		if (!userId) return;
		setReels((prev) =>
			prev.map((reel) => {
				if (reel._id !== reelId) return reel;
				return { ...reel, likes: reel.likes.filter((id: string) => id !== userId) };
			}),
		);
		try {
			await unlikePost(reelId);
		} catch {
			fetchReels(1, true);
		}
	};

	const handleReelDeleted = (reelId: string) => {
		setReels((prev) => prev.filter((reel) => reel._id !== reelId));
	};

	const handleReelUpdated = (updated: (typeof reels)[0]) => {
		setReels((prev) => prev.map((reel) => (reel._id === updated._id ? { ...reel, ...updated } : reel)));
	};

	const handlePublish = async (video: Blob | File, description: string) => {
		try {
			const res = await createReel({ video, description, visibility });
			if (res) {
				notify.success('Reel posted');
				setView('browse');
				fetchReels(1, true);
				setHasMore(true);
			}
		} catch (err: any) {
			notify.error(err?.message || 'Could not post reel');
		}
	};

	if (view === 'create') {
		return (
			<ReelEditor
				onPublish={handlePublish}
				onCancel={() => setView('browse')}
				publishing={loading}
				visibility={visibility}
				onVisibilityChange={setVisibility}
			/>
		);
	}

	return (
		<div className="relative flex flex-col h-[calc(100dvh-52px)] sm:h-[calc(100vh-52px)] bg-surface dark:bg-void">
			<div className="shrink-0 flex items-center justify-end px-4 py-2.5 border-b border-border-subtle dark:border-void-border bg-surface/90 dark:bg-void/90 backdrop-blur-sm">
				<motion.button
					whileTap={{ scale: 0.96 }}
					onClick={() => setView('create')}
					className="flex items-center gap-1.5 bg-relay text-white rounded-full py-2 px-4 font-display font-semibold text-sm relay-glow"
				>
					<HiPlus className="w-4 h-4" />
					<span>Create</span>
				</motion.button>
			</div>

			<div
				id="reels-scroll"
				onScroll={handleScroll}
				className="flex-1 overflow-y-auto snap-y snap-mandatory no-scrollbar"
			>
				{reels.length === 0 && !loading ? (
					<div className="snap-start h-full min-h-[420px] flex flex-col items-center justify-center px-8 text-center">
						<div className="w-14 h-14 rounded-2xl bg-relay/10 flex items-center justify-center mb-4">
							<HiFilm className="w-7 h-7 text-relay" />
						</div>
						<h2 className="font-display font-bold text-lg text-ink dark:text-cream mb-2">No updates yet</h2>
						<p className="font-body text-ink-muted dark:text-cream-muted text-[15px] mb-6 max-w-[260px]">
							Record a quick video about what's going on.
						</p>
						<motion.button
							whileTap={{ scale: 0.96 }}
							onClick={() => setView('create')}
							className="bg-relay text-white rounded-full py-3.5 px-8 font-display font-semibold text-sm"
						>
							Record now
						</motion.button>
					</div>
				) : (
					<AnimatePresence mode="popLayout">
						{reels.map((reel) => (
							<ReelCard
								key={reel._id}
								reel={reel}
								onLike={handleLike}
								onUnlike={handleUnlike}
								onDeleted={handleReelDeleted}
								onUpdated={handleReelUpdated}
							/>
						))}
					</AnimatePresence>
				)}

				{loading && (
					<div className="py-10 flex justify-center">
						<Spinner loading={loading} />
					</div>
				)}
			</div>
		</div>
	);
};
