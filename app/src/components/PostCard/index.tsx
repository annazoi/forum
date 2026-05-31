import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
	HiOutlineHeart,
	HiHeart,
	HiOutlineChatAlt,
	HiOutlineShare,
	HiOutlineGlobeAlt,
} from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import { authStore } from '../../store/auth';
import { Lightbox } from '../ui/Lightbox';
import { PostActionsMenu } from '../PostActionsMenu';

interface PostCardProps {
	post: {
		_id: string;
		description: string;
		image?: string;
		video?: string;
		type?: 'post' | 'reel';
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
		visibility?: 'public' | 'private';
	};
	onLike: (id: string) => void;
	onUnlike: (id: string) => void;
	onDeleted?: (postId: string) => void;
	onUpdated?: (post: PostCardProps['post']) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, onUnlike, onDeleted, onUpdated }) => {
	const { userId } = authStore();
	const isLiked = userId ? post.likes.includes(userId) : false;
	const [isLightboxOpen, setIsLightboxOpen] = useState(false);
	const isOwner = !!userId && String(post.creatorId?._id) === String(userId);

	const username = post.creatorId?.username || 'user';
	const name = post.creatorId?.name || 'User';
	const surname = post.creatorId?.surname || '';

	return (
		<>
			<motion.article
				layout
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.98 }}
				className="px-5 py-4 border-b border-border-subtle dark:border-void-border transition-colors group relative hover:bg-parchment-deep/30 dark:hover:bg-void-surface/50"
			>
				<div className="flex gap-3.5">
					<Link
						to={`/profile/${post.creatorId?._id}`}
						className="shrink-0 pt-0.5"
						onClick={(e) => e.stopPropagation()}
					>
						<motion.div
							whileHover={{ scale: 1.05 }}
							className="w-11 h-11 rounded-xl bg-parchment-deep dark:bg-void-surface overflow-hidden border border-border-subtle dark:border-void-border"
						>
							{post.creatorId?.image ? (
								<img src={post.creatorId.image} alt={username} className="w-full h-full object-cover" />
							) : (
								<div className="w-full h-full flex items-center justify-center font-display font-bold text-ink-faint dark:text-cream-faint text-sm">
									{username[0].toUpperCase()}
								</div>
							)}
						</motion.div>
					</Link>

					<div className="flex-1 min-w-0">
						<div className="flex items-center justify-between gap-2">
							<div className="flex items-center gap-1.5 min-w-0 flex-wrap">
								<Link
									to={`/profile/${post.creatorId?._id}`}
									className="font-display font-semibold text-[14px] text-ink dark:text-cream hover:text-relay transition-colors truncate"
									onClick={(e) => e.stopPropagation()}
								>
									{name} {surname}
								</Link>
								<span className="font-mono text-[12px] text-ink-faint dark:text-cream-faint truncate">
									@{username}
								</span>
								<span className="text-ink-faint dark:text-cream-faint text-xs">·</span>
								<span className="font-mono text-[11px] text-ink-faint dark:text-cream-faint whitespace-nowrap">
									{post.date ? formatDistanceToNow(new Date(post.date)) : ''}
								</span>
								{post.visibility === 'public' && (
									<HiOutlineGlobeAlt className="w-3 h-3 text-ink-faint dark:text-cream-faint opacity-50" />
								)}
							</div>
							<PostActionsMenu
								postId={post._id}
								description={post.description}
								visibility={post.visibility}
								isOwner={isOwner}
								contentType={post.type === 'reel' ? 'reel' : 'post'}
								onDeleted={onDeleted}
								onUpdated={(updated) => onUpdated?.({ ...post, ...updated })}
							/>
						</div>

						<Link to={`/post/${post._id}`} className="block mt-1.5">
							<p className="font-body text-[15px] leading-relaxed text-ink/90 dark:text-cream/90 whitespace-pre-wrap break-words">
								{post.description}
							</p>

							{post.video && (
								<div className="mt-3 relative overflow-hidden rounded-xl border border-border-subtle dark:border-void-border bg-ink dark:bg-void-elevated">
									<video
										src={post.video}
										controls
										playsInline
										className="w-full h-auto max-h-[480px] object-cover"
									/>
								</div>
							)}

							{post.image && !post.video && (
								<div className="mt-3 relative group/image overflow-hidden rounded-xl border border-border-subtle dark:border-void-border bg-parchment-deep/40 dark:bg-void-surface">
									<motion.button
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											setIsLightboxOpen(true);
										}}
									>
										<img
											src={post.image}
											alt="Post"
											className="w-full h-auto max-h-[480px] object-cover cursor-pointer transition-transform duration-500 group-hover/image:scale-[1.02]"
										/>
									</motion.button>
								</div>
							)}
						</Link>

						<div className="flex items-center gap-1 mt-3 -ml-1.5">
							<Link
								to={`/post/${post._id}`}
								className="flex items-center gap-1.5 group/action px-2.5 py-1.5 rounded-lg hover:bg-parchment-deep dark:hover:bg-void-surface transition-colors"
								onClick={(e) => e.stopPropagation()}
							>
								<HiOutlineChatAlt className="w-[18px] h-[18px] text-ink-faint dark:text-cream-faint group-hover/action:text-relay transition-colors" />
								<span className="font-mono text-[12px] text-ink-faint dark:text-cream-faint group-hover/action:text-relay transition-colors">
									{post.comments?.length || 0}
								</span>
							</Link>

							<button
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									isLiked ? onUnlike(post._id) : onLike(post._id);
								}}
								className="flex items-center gap-1.5 group/action px-2.5 py-1.5 rounded-lg hover:bg-relay/8 transition-colors"
							>
								<motion.div whileTap={{ scale: 1.3 }}>
									{isLiked ? (
										<HiHeart className="w-[18px] h-[18px] text-relay" />
									) : (
										<HiOutlineHeart className="w-[18px] h-[18px] text-ink-faint dark:text-cream-faint group-hover/action:text-relay transition-colors" />
									)}
								</motion.div>
								<AnimatePresence mode="wait">
									<motion.span
										key={post.likes.length}
										initial={{ y: -6, opacity: 0 }}
										animate={{ y: 0, opacity: 1 }}
										exit={{ y: 6, opacity: 0 }}
										className={`font-mono text-[12px] ${isLiked ? 'text-relay' : 'text-ink-faint dark:text-cream-faint group-hover/action:text-relay'} transition-colors`}
									>
										{post.likes.length || 0}
									</motion.span>
								</AnimatePresence>
							</button>

							<button
								className="flex items-center gap-1.5 group/action px-2.5 py-1.5 rounded-lg hover:bg-parchment-deep dark:hover:bg-void-surface transition-colors"
								onClick={(e) => e.stopPropagation()}
							>
								<HiOutlineShare className="w-[18px] h-[18px] text-ink-faint dark:text-cream-faint group-hover/action:text-signal transition-colors" />
							</button>
						</div>
					</div>
				</div>
			</motion.article>

			<Lightbox
				isOpen={isLightboxOpen}
				onClose={() => setIsLightboxOpen(false)}
				src={post.image || ''}
				alt={`${username}'s post`}
			/>
		</>
	);
};
