import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
	HiOutlineHeart,
	HiHeart,
	HiOutlineChatAlt,
	HiOutlineVolumeUp,
	HiOutlineVolumeOff,
} from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import { authStore } from '../../store/auth';

interface ReelCardProps {
	reel: {
		_id: string;
		description?: string;
		video?: string;
		date: string;
		likes: string[];
		comments: any[];
		creatorId: {
			_id: string;
			username: string;
			image?: string;
			name?: string;
			surname?: string;
		};
	};
	onLike: (id: string) => void;
	onUnlike: (id: string) => void;
}

export const ReelCard: React.FC<ReelCardProps> = ({ reel, onLike, onUnlike }) => {
	const { userId } = authStore();
	const containerRef = useRef<HTMLElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const [muted, setMuted] = useState(true);
	const [playing, setPlaying] = useState(false);

	const isLiked = userId ? reel.likes.includes(userId) : false;
	const username = reel.creatorId?.username || 'user';
	const name = reel.creatorId?.name || 'User';
	const surname = reel.creatorId?.surname || '';

	useEffect(() => {
		const el = containerRef.current;
		const video = videoRef.current;
		if (!el || !video) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					video.play().catch(() => {});
					setPlaying(true);
				} else {
					video.pause();
					setPlaying(false);
				}
			},
			{ threshold: 0.6 },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [reel.video]);

	const togglePlay = () => {
		const video = videoRef.current;
		if (!video) return;
		if (video.paused) {
			video.play();
			setPlaying(true);
		} else {
			video.pause();
			setPlaying(false);
		}
	};

	return (
		<motion.article
			ref={containerRef}
			layout
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="relative snap-start snap-always h-[calc(100dvh-52px)] sm:h-[calc(100vh-52px)] w-full shrink-0"
		>
			{reel.video ? (
				<video
					ref={videoRef}
					src={reel.video}
					className="absolute inset-0 w-full h-full object-cover"
					loop
					muted={muted}
					playsInline
					onClick={togglePlay}
				/>
			) : (
				<div className="absolute inset-0 flex items-center justify-center bg-void-surface text-cream-faint font-mono text-sm">
					Video unavailable
				</div>
			)}

			<div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 pointer-events-none" />

			{!playing && reel.video && (
				<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
					<div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
						<div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[18px] border-l-white border-b-[12px] border-b-transparent ml-1" />
					</div>
				</div>
			)}

			<div className="absolute bottom-0 left-0 right-16 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
				<Link
					to={`/profile/${reel.creatorId?._id}`}
					className="flex items-center gap-2.5 mb-2"
				>
					<div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/40 shrink-0">
						{reel.creatorId?.image ? (
							<img src={reel.creatorId.image} alt={username} className="w-full h-full object-cover" />
						) : (
							<div className="w-full h-full bg-relay/50 flex items-center justify-center font-display font-bold text-white text-sm">
								{username[0].toUpperCase()}
							</div>
						)}
					</div>
					<div>
						<p className="font-display font-semibold text-white text-[15px]">
							{name} {surname}
						</p>
						<p className="font-mono text-[11px] text-white/55">@{username}</p>
					</div>
				</Link>

				{reel.description && (
					<p className="font-body text-[15px] text-white/90 leading-snug line-clamp-3 mb-1">
						{reel.description}
					</p>
				)}

				<p className="font-mono text-[10px] text-white/45 uppercase tracking-wider">
					{reel.date ? formatDistanceToNow(new Date(reel.date), { addSuffix: true }) : ''}
				</p>
			</div>

			<div className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 flex flex-col items-center gap-5">
				<button
					onClick={() => setMuted(!muted)}
					className="p-3 rounded-full bg-black/35 backdrop-blur-sm text-white active:scale-90 transition-transform"
				>
					{muted ? <HiOutlineVolumeOff className="w-6 h-6" /> : <HiOutlineVolumeUp className="w-6 h-6" />}
				</button>

				<button
					onClick={() => (isLiked ? onUnlike(reel._id) : onLike(reel._id))}
					className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
				>
					<div className="p-3 rounded-full bg-black/35 backdrop-blur-sm">
						{isLiked ? (
							<HiHeart className="w-6 h-6 text-relay" />
						) : (
							<HiOutlineHeart className="w-6 h-6 text-white" />
						)}
					</div>
					<AnimatePresence mode="wait">
						<motion.span
							key={reel.likes.length}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="font-mono text-[11px] text-white/75"
						>
							{reel.likes.length || 0}
						</motion.span>
					</AnimatePresence>
				</button>

				<Link to={`/post/${reel._id}`} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
					<div className="p-3 rounded-full bg-black/35 backdrop-blur-sm">
						<HiOutlineChatAlt className="w-6 h-6 text-white" />
					</div>
					<span className="font-mono text-[11px] text-white/75">{reel.comments?.length || 0}</span>
				</Link>
			</div>
		</motion.article>
	);
};
