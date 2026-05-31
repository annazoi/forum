import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { HiArrowLeft } from 'react-icons/hi';
import { usePostHook } from '../../hooks/use-posts';
import { authStore } from '../../store/auth';
import { commentSchema } from '../../validation-schemas/comment';
import { PostCard } from '../../components/PostCard';
import { Spinner } from '../../components/ui/Spinner';
import { notify } from '../../utils/toast';

interface CommentForm {
	description: string;
}

export const Post: React.FC = () => {
	const isLoggedIn = authStore((state) => state.isLoggedIn);
	const userId = authStore((state) => state.userId);
	const userImage = authStore((state) => state.image);
	const { getPost, createComment, likePost, unlikePost, loading, error } = usePostHook();
	const [post, setPost] = useState<any>(null);
	const { postId } = useParams<{ postId: string }>();
	const navigate = useNavigate();

	const { register, handleSubmit, reset, formState: { errors } } = useForm<CommentForm>({
		defaultValues: { description: '' },
		resolver: yupResolver(commentSchema),
	});

	const fetchPost = async () => {
		if (!postId) return;
		try {
			const res = await getPost(postId);
			if (res) setPost(res);
		} catch (err) {
			console.error(err);
		}
	};

	const handleLike = async (id: string) => {
		if (!userId || !post) return;
		if (post.likes.includes(userId)) return;

		setPost((prev: any) => ({
			...prev,
			likes: [...prev.likes, userId],
		}));

		try {
			await likePost(id);
		} catch (err) {
			fetchPost();
		}
	};

	const handleUnlike = async (id: string) => {
		if (!userId || !post) return;

		setPost((prev: any) => ({
			...prev,
			likes: prev.likes.filter((uid: string) => uid !== userId),
		}));

		try {
			await unlikePost(id);
		} catch (err) {
			fetchPost();
		}
	};

	const handlePostDeleted = () => {
		navigate(-1);
	};

	const handlePostUpdated = (updated: any) => {
		setPost((prev: any) => (prev ? { ...prev, ...updated } : prev));
	};

	useEffect(() => {
		fetchPost();
	}, [postId]);

	const onSubmit = async (data: CommentForm) => {
		if (!isLoggedIn) return notify.info('Please login first');
		try {
			const res = await createComment(data, post._id);
			if (res.message === 'ok') {
				reset();
				fetchPost();
			}
		} catch (err) {
			notify.error('Could not post reply');
		}
	};

	if (loading && !post) return <div className="p-10 flex justify-center"><Spinner loading={loading} /></div>;
	if (error) return <div className="p-10 text-center font-display font-semibold text-relay">{error}</div>;
	if (!post) return null;

	return (
		<div className="divide-y divide-border-subtle dark:divide-void-border bg-surface dark:bg-void min-h-screen transition-colors">
			<div className="sticky top-0 z-30 bg-surface/85 dark:bg-void/85 backdrop-blur-xl px-4 h-[52px] flex items-center gap-6 border-b border-border-subtle dark:border-void-border">
				<button onClick={() => navigate(-1)} className="p-2 hover:bg-parchment-deep/60 dark:hover:bg-void-surface rounded-lg transition-colors text-ink-muted dark:text-cream-muted">
					<HiArrowLeft className="w-5 h-5" />
				</button>
				<h1 className="font-display font-bold text-[17px] tracking-tight text-ink dark:text-cream">Thread</h1>
			</div>

			<PostCard
				post={post}
				onLike={handleLike}
				onUnlike={handleUnlike}
				onDeleted={handlePostDeleted}
				onUpdated={handlePostUpdated}
			/>

			{isLoggedIn && (
				<div className="p-4 flex gap-3 bg-surface dark:bg-void">
					<div className="w-10 h-10 rounded-xl bg-parchment-deep dark:bg-void-surface shrink-0 overflow-hidden border border-border-subtle dark:border-void-border">
						{userImage ? (
							<img src={userImage} alt="Profile" className="w-full h-full object-cover" />
						) : (
							<div className="w-full h-full flex items-center justify-center font-display font-bold text-ink-faint dark:text-cream-faint text-sm">U</div>
						)}
					</div>
					<form className="flex-1" onSubmit={handleSubmit(onSubmit)}>
						<textarea
							{...register('description')}
							placeholder="Post your reply"
							className="w-full font-body text-[15px] resize-none border-none focus:ring-0 placeholder:text-ink-faint dark:placeholder:text-cream-faint py-2 min-h-[60px] text-ink dark:text-cream bg-transparent"
						/>
						{errors.description && (
							<p className="text-relay text-xs font-mono font-medium uppercase tracking-wider mb-2 ml-1">
								{errors.description.message}
							</p>
						)}
						<div className="flex justify-end pt-2 border-t border-border-subtle dark:border-void-border">
							<button
								type="submit"
								disabled={loading}
								className="bg-relay text-white px-6 py-2 rounded-xl font-display font-semibold text-sm hover:bg-relay-hover active:scale-95 disabled:opacity-40 transition-all relay-glow"
							>
								Reply
							</button>
						</div>
					</form>
				</div>
			)}

			<div className="flex flex-col">
				{post.comments?.map((comment: any) => (
					<div key={comment._id} className="p-4 border-b border-border-subtle dark:border-void-border hover:bg-parchment-deep/30 dark:hover:bg-void-surface/50 transition-colors">
						<div className="flex gap-3">
							<Link to={`/profile/${comment.creatorId._id}`} className="shrink-0">
								<div className="w-10 h-10 rounded-xl bg-parchment-deep dark:bg-void-surface overflow-hidden border border-border-subtle dark:border-void-border">
									{comment.creatorId.image ? (
										<img src={comment.creatorId.image} alt={comment.creatorId.username} className="w-full h-full object-cover" />
									) : (
										<div className="w-full h-full flex items-center justify-center font-display font-bold text-ink-faint dark:text-cream-faint text-sm">
											{comment.creatorId.username[0].toUpperCase()}
										</div>
									)}
								</div>
							</Link>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-1 mb-1">
									<span className="font-display font-semibold text-[14px] text-ink dark:text-cream truncate hover:text-relay transition-colors">{comment.creatorId.name}</span>
									<span className="font-mono text-[12px] text-ink-faint dark:text-cream-faint truncate">@{comment.creatorId.username}</span>
									<span className="text-ink-faint dark:text-cream-faint text-xs">·</span>
									<span className="font-mono text-[11px] text-ink-faint dark:text-cream-faint italic">Just now</span>
								</div>
								<p className="font-body text-ink/90 dark:text-cream/90 text-[15px] leading-relaxed">{comment.description}</p>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
