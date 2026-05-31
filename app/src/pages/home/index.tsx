import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { HiOutlinePhotograph, HiOutlineEmojiHappy, HiX, HiPlus, HiOutlineGlobeAlt, HiOutlineLockClosed } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import { usePostHook } from '../../hooks/use-posts';
import { authStore } from '../../store/auth';
import { postSchema } from '../../validation-schemas/post';
import { PostCard } from '../../components/PostCard';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import EmojiPicker from 'emoji-picker-react';

interface PostForm {
	description: string | undefined;
}

export const Home: React.FC = () => {
	const isLoggedIn = authStore((state) => state.isLoggedIn);
	const userImage = authStore((state) => state.image);
	const userId = authStore((state) => state.userId);
	const [openEmojiPicker, setOpenEmojiPicker] = useState(false);
	const [showFullPicker, setShowFullPicker] = useState(false);
	const [visibility, setVisibility] = useState<'public' | 'private'>('public');

	const { createPost, getPosts, getPost, likePost, unlikePost, loading } = usePostHook();

	const [posts, setPosts] = useState<any[]>([]);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const {
		register,
		handleSubmit,
		reset,
		watch,
		setValue,
		formState: { errors },
	} = useForm<PostForm>({
		defaultValues: { description: '' },
		resolver: yupResolver(postSchema),
	});

	const description = watch('description');

	const fetchPosts = useCallback(
		async (pageNum: number, isInitial = false) => {
			try {
				const newPosts = await getPosts('', pageNum);
				if (newPosts && Array.isArray(newPosts)) {
					if (newPosts.length < 10) setHasMore(false);
					if (isInitial) {
						setPosts(newPosts);
					} else {
						setPosts((prev) => [...prev, ...newPosts]);
					}
				} else {
					setHasMore(false);
				}
			} catch (err) {
				console.error('Error fetching posts', err);
				setHasMore(false);
			}
		},
		[getPosts],
	);

	useEffect(() => {
		fetchPosts(1, true);
	}, [fetchPosts]);

	const handleScroll = useCallback(() => {
		if (
			window.innerHeight + document.documentElement.scrollTop + 1 >= document.documentElement.scrollHeight &&
			!loading &&
			hasMore
		) {
			setPage((prev) => {
				const next = prev + 1;
				fetchPosts(next);
				return next;
			});
		}
	}, [loading, hasMore, fetchPosts]);

	useEffect(() => {
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, [handleScroll]);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setSelectedImage(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};
	const handleLike = async (postId: string) => {
		if (!userId) return;

		setPosts((prev) =>
			prev.map((post) => {
				if (post._id !== postId) return post;
				if (post.likes.includes(userId)) return post;

				return {
					...post,
					likes: [...post.likes, userId],
				};
			}),
		);

		try {
			await likePost(postId);
		} catch (err) {
			fetchPosts(1, true);
		}
	};

	const handleUnlike = async (postId: string) => {
		if (!userId) return;

		setPosts((prev) =>
			prev.map((post) => {
				if (post._id !== postId) return post;

				return {
					...post,
					likes: post.likes.filter((id: string) => id !== userId),
				};
			}),
		);

		try {
			await unlikePost(postId);
		} catch (err) {
			fetchPosts(1, true);
		}
	};

	const onSubmit = async (data: PostForm) => {
		if (!isLoggedIn) return alert('Please login first');
		try {
			const res = await createPost({
				...data,
				image: selectedImage || undefined,
				visibility: visibility,
			});
			if (res) {
				reset();
				setSelectedImage(null);
				setVisibility('public');
				fetchPosts(1, true);
				setPage(1);
				setHasMore(true);
			}
		} catch (err) {
			alert('Could not create post');
		}
	};

	const handleEmojiClick = (emoji: string) => {
		const currentText = watch('description') || '';
		setValue('description', currentText + emoji, { shouldValidate: true });
	};

	return (
		<div className="bg-surface dark:bg-void min-h-screen transition-colors duration-300">
			{isLoggedIn && (
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="p-5 border-b border-border-subtle dark:border-void-border bg-surface dark:bg-void"
				>
					<div className="flex gap-3.5">
						<div className="w-11 h-11 rounded-xl bg-parchment-deep dark:bg-void-surface shrink-0 overflow-hidden flex items-center justify-center border border-border-subtle dark:border-void-border">
							{userImage ? (
								<img src={userImage} alt="Profile" className="w-full h-full object-cover" />
							) : (
								<div className="w-full h-full bg-relay/20 flex items-center justify-center font-display font-bold text-relay text-sm" />
							)}
						</div>
						<form className="flex-1 min-w-0" onSubmit={handleSubmit(onSubmit)}>
							<textarea
								{...register('description')}
								placeholder="What's happening?!"
								className="w-full font-body text-[15px] md:text-base resize-none border-none focus:ring-0 placeholder:text-ink-faint dark:placeholder:text-cream-faint p-2 min-h-[80px] text-ink dark:text-cream bg-transparent"
							/>

							<AnimatePresence>
								{selectedImage && (
									<motion.div
										initial={{ opacity: 0, scale: 0.95, y: 10 }}
										animate={{ opacity: 1, scale: 1, y: 0 }}
										exit={{ opacity: 0, scale: 0.95, y: 10 }}
										className="relative mt-3 mb-3 group overflow-hidden rounded-xl border border-border-subtle dark:border-void-border"
									>
										<img
											src={selectedImage}
											alt="Preview"
											className="w-full max-h-[450px] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
										/>
										<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
										<button
											type="button"
											onClick={() => setSelectedImage(null)}
											className="absolute top-3 right-3 p-2 bg-ink/60 hover:bg-relay text-white rounded-lg transition-all backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
										>
											<HiX className="h-4 w-4" />
										</button>
									</motion.div>
								)}
							</AnimatePresence>

							<AnimatePresence>
								{errors.description && (
									<motion.p
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: 'auto' }}
										exit={{ opacity: 0, height: 0 }}
										className="text-relay text-xs font-mono font-medium uppercase tracking-wider mb-2 ml-1"
									>
										{errors.description.message}
									</motion.p>
								)}
							</AnimatePresence>

							<motion.div
								layout
								className="flex items-center justify-between pt-3 border-t border-border-subtle dark:border-void-border"
							>
								<div className="flex gap-0.5">
									<input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageChange} />
									<button
										type="button"
										onClick={() => fileInputRef.current?.click()}
										className="p-2 text-relay hover:bg-relay/8 rounded-lg transition-all active:scale-90"
									>
										<HiOutlinePhotograph className="w-5 h-5" />
									</button>
									<button
										type="button"
										onClick={() => {
											setOpenEmojiPicker(!openEmojiPicker);
											if (openEmojiPicker) setShowFullPicker(false);
										}}
										className={`p-2 rounded-lg transition-all active:scale-90 ${
											openEmojiPicker
												? 'bg-relay text-white'
												: 'text-relay hover:bg-relay/8'
										}`}
									>
										<HiOutlineEmojiHappy className="w-5 h-5" />
									</button>

									<button
										type="button"
										onClick={() => setVisibility(visibility === 'public' ? 'private' : 'public')}
										title={visibility === 'public' ? 'Visible to everyone' : 'Only your followers can see this'}
										className={`ml-1 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all text-[10px] font-mono font-medium uppercase tracking-wider ${
											visibility === 'public'
												? 'text-ink-muted dark:text-cream-muted border-border dark:border-void-border hover:bg-parchment-deep/60 dark:hover:bg-void-surface'
												: 'text-relay border-relay/30 bg-relay/8'
										}`}
									>
										{visibility === 'public' ? (
											<HiOutlineGlobeAlt className="w-3.5 h-3.5" />
										) : (
											<HiOutlineLockClosed className="w-3.5 h-3.5" />
										)}
										<span className="hidden sm:inline">{visibility === 'public' ? 'Public' : 'Followers'}</span>
									</button>
								</div>

								<Button
									label="Relay"
									type="submit"
									disabled={loading || (!description && !selectedImage)}
									loading={loading}
									className="!px-6 !py-2 !rounded-xl !font-display !font-semibold !text-sm relay-glow"
								/>
							</motion.div>
							<AnimatePresence>
								{openEmojiPicker && (
									<motion.div
										layout
										initial={{ opacity: 0, height: 0, marginTop: 0 }}
										animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
										exit={{ opacity: 0, height: 0, marginTop: 0 }}
										className="overflow-hidden w-full"
									>
										<div className="bg-parchment-deep/50 dark:bg-void-surface/50 rounded-xl p-2 border border-border-subtle dark:border-void-border w-full overflow-hidden">
											<div className="flex items-center gap-3">
												<div className="flex-1 min-w-0">
													<div className="flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1">
														{['😀', '😂', '😍', '🙌', '🔥', '✨', '❤️', '👍', '🙏', '🎉', '💡', '🚀', '⭐', '💯', '✅'].map(
															(em) => (
																<button
																	key={em}
																	type="button"
																	onClick={() => handleEmojiClick(em)}
																	className="text-2xl hover:scale-125 transition-all p-1.5 grayscale-[0.6] hover:grayscale-0 duration-300 flex-shrink-0"
																>
																	{em}
																</button>
															),
														)}
													</div>
												</div>
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														setShowFullPicker(!showFullPicker);
													}}
													className={`p-2 rounded-lg transition-all flex items-center justify-center flex-shrink-0 relative z-10 ${
														showFullPicker
															? 'bg-relay text-white'
															: 'bg-relay/10 text-relay hover:bg-relay/20'
													}`}
												>
													<HiPlus
														className={`w-4 h-4 transition-transform duration-300 ${showFullPicker ? 'rotate-45' : ''}`}
													/>
												</button>
											</div>

											{showFullPicker && (
												<motion.div
													initial={{ opacity: 0, y: 10 }}
													animate={{ opacity: 1, y: 0 }}
													className="mt-3 relative w-full overflow-hidden rounded-xl border border-border dark:border-void-border shadow-lg shadow-ink/5"
												>
													<EmojiPicker
														onEmojiClick={(emojiObject) => handleEmojiClick(emojiObject.emoji)}
														autoFocusSearch={false}
														theme={document.documentElement.classList.contains('dark') ? ('dark' as any) : ('light' as any)}
														width="100%"
														height={350}
														skinTonesDisabled
														searchPlaceHolder="Search emoji..."
													/>
												</motion.div>
											)}
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</form>
					</div>
				</motion.div>
			)}

			<div className="flex flex-col">
				<AnimatePresence mode="popLayout">
					{posts.map((post, index) => (
						<motion.div
							key={post._id}
							initial={{ opacity: 0, x: -10 }}
							animate={{
								opacity: 1,
								x: 0,
								transition: { delay: index * 0.04, duration: 0.35 },
							}}
							viewport={{ once: true }}
						>
							<PostCard post={post} onLike={handleLike} onUnlike={handleUnlike} />
						</motion.div>
					))}
				</AnimatePresence>

				{loading && (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-16 flex justify-center">
						<Spinner loading={loading} />
					</motion.div>
				)}

				{!hasMore && posts.length > 0 && (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
						<p className="font-display font-bold text-ink-faint dark:text-cream-faint text-xl tracking-tight mb-3">
							You're all caught up
						</p>
						<div className="w-8 h-0.5 bg-signal mx-auto rounded-full opacity-40" />
					</motion.div>
				)}
			</div>
		</div>
	);
};
