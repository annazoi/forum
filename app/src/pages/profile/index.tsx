import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
	HiArrowLeft, HiOutlineCalendar, HiOutlineMail,
	HiOutlinePencilAlt, HiOutlineShare
} from 'react-icons/hi';
import { useUserHook } from '../../hooks/use-user';
import { usePostHook } from '../../hooks/use-posts';
import { authStore } from '../../store/auth';
import { PostCard } from '../../components/PostCard';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/Modal';
import { Form } from '../../components/Form';
import { ImagePicker } from '../../components/ui/ImagePicker';
import { Button } from '../../components/ui/Button';
import * as yup from 'yup';
import { notify } from '../../utils/toast';

const profileUpdateSchema = yup.object().shape({
	name: yup.string().required('First name is required'),
	surname: yup.string().required('Surname is required'),
	username: yup.string().required('Username is required'),
	email: yup.string().email('Invalid email').required('Email is required'),
	image: yup.string().optional(),
	bio: yup.string().optional(),
});

interface ProfileFormData {
	name: string;
	surname: string;
	username: string;
	email: string;
	image?: string;
	bio?: string;
}

export const Profile: React.FC = () => {
	const { creatorId } = useParams<{ creatorId: string }>();
	const navigate = useNavigate();
	const userId = authStore((state) => state.userId);
	const isLoggedIn = authStore((state) => state.isLoggedIn);

	const { getUser, followUser, unfollowUser, updateUser, loading: userLoading, userError } = useUserHook();
	const { getPosts, likePost, unlikePost, loading: postLoading } = usePostHook();

	const [user, setUser] = useState<any>(null);
	const [posts, setPosts] = useState<any[]>([]);
	const [isFollowing, setIsFollowing] = useState(false);
	const [openModal, setOpenModal] = useState(false);

	const {
		register,
		handleSubmit,
		setValue,
		reset,
		getValues,
		formState: { errors },
	} = useForm<ProfileFormData>({
		resolver: yupResolver(profileUpdateSchema) as any,
	});

	const fetchData = async () => {
		if (!creatorId) return;
		try {
			const userData = await getUser(creatorId);
			if (userData) {
				setUser(userData);
				setIsFollowing(userData.followers?.includes(userId));
				reset({
					name: userData.name,
					surname: userData.surname,
					username: userData.username,
					email: userData.email,
					image: userData.image,
					bio: userData.bio || '',
				});
			}
			const userPosts = await getPosts(creatorId);
			if (userPosts) setPosts(userPosts);
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		setUser(null);
		setPosts([]);
		fetchData();
	}, [creatorId, userId]);

	const handleFollow = async () => {
		if (!isLoggedIn) return notify.info('Please login first');
		if (isFollowing) {
			await unfollowUser(creatorId!);
			setIsFollowing(false);
		} else {
			await followUser(creatorId!);
			setIsFollowing(true);
		}
		fetchData();
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
			fetchData();
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
			fetchData();
		}
	};

	const handlePostDeleted = (postId: string) => {
		setPosts((prev) => prev.filter((post) => post._id !== postId));
	};

	const handlePostUpdated = (updated: (typeof posts)[0]) => {
		setPosts((prev) => prev.map((post) => (post._id === updated._id ? { ...post, ...updated } : post)));
	};

	const onSubmit = async (data: ProfileFormData) => {
		try {
			await updateUser(creatorId!, data);
			setOpenModal(false);
			fetchData();
			notify.success('Profile updated successfully!');
		} catch (err) {
			console.error('Could not update user', err);
			notify.error('Could not update profile');
		}
	};

	const handleImage = (image: string) => {
		setValue('image', image);
	};

	if (userLoading && !user) return <div className="p-10 flex justify-center"><Spinner loading={userLoading} /></div>;
	if (userError) return <div className="p-10 text-center font-display font-semibold text-relay">{userError}</div>;
	if (!user) return null;

	const isOwnProfile = userId === creatorId;

	return (
		<div className="flex flex-col animate-in fade-in duration-700">
			<div className="sticky top-0 z-30 bg-surface/85 dark:bg-void/85 backdrop-blur-xl px-4 h-[52px] flex items-center gap-6 border-b border-border-subtle dark:border-void-border">
				<button onClick={() => navigate(-1)} className="p-2 hover:bg-parchment-deep/60 dark:hover:bg-void-surface rounded-lg transition-colors text-ink-muted dark:text-cream-muted">
					<HiArrowLeft className="w-5 h-5" />
				</button>
				<div>
					<h1 className="font-display font-bold text-[17px] tracking-tight text-ink dark:text-cream">{user.name} {user.surname}</h1>
					<p className="font-mono text-[10px] text-ink-faint dark:text-cream-faint uppercase tracking-wider">{posts.length} Posts</p>
				</div>
			</div>

			<section className="relative group/banner">
				<div className="h-40 md:h-52 bg-gradient-to-br from-parchment via-surface to-parchment-deep dark:from-void-elevated dark:via-void dark:to-void-surface relative overflow-hidden">
					<div className="absolute top-0 right-0 w-64 h-64 bg-relay/10 rounded-full -mr-20 -mt-20 blur-3xl transition-transform duration-1000 group-hover/banner:scale-110"></div>
					<div className="absolute bottom-0 left-0 w-48 h-48 bg-signal/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>
					{user.coverPhoto && <img src={user.coverPhoto} alt="Cover" className="w-full h-full object-cover" />}
				</div>

				<div className="px-5 pb-5 relative bg-surface dark:bg-void transition-colors">
					<div className="flex justify-between items-end -mt-16 md:-mt-20 mb-5">
						<div className="relative group">
							<div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl border-4 border-surface dark:border-void bg-parchment-deep dark:bg-void-surface overflow-hidden shrink-0 transition-transform duration-500 group-hover:scale-[1.02]">
								{user.image ? (
									<img src={user.image} alt={user.username} className="w-full h-full object-cover" />
								) : (
									<div className="w-full h-full flex items-center justify-center text-4xl text-ink-faint dark:text-cream-faint font-display font-bold">
										{user.username[0]?.toUpperCase()}
									</div>
								)}
							</div>
						</div>

						<div className="flex gap-2 mb-1">
							{isOwnProfile ? (
								<button
									onClick={() => setOpenModal(true)}
									className="px-5 py-2 rounded-xl font-display font-semibold text-sm bg-surface-elevated dark:bg-void-surface border border-border dark:border-void-border hover:bg-parchment-deep dark:hover:bg-void-elevated text-ink dark:text-cream transition-all flex items-center gap-2 active:scale-95"
								>
									<HiOutlinePencilAlt className="w-4 h-4 text-relay" />
									Edit Profile
								</button>
							) : (
								<>
									<button className="p-2 rounded-xl border border-border dark:border-void-border hover:bg-parchment-deep/60 dark:hover:bg-void-surface text-ink-muted dark:text-cream-muted active:scale-90 transition-all">
										<HiOutlineShare className="w-5 h-5" />
									</button>
									<button
										onClick={handleFollow}
										className={`px-6 py-2 rounded-xl font-display font-semibold text-sm active:scale-95 transition-all ${isFollowing
											? 'border border-border dark:border-void-border bg-surface-elevated dark:bg-void-surface text-ink dark:text-cream hover:text-relay hover:border-relay/30 hover:bg-relay/8'
											: 'bg-relay text-white hover:bg-relay-hover relay-glow'
											}`}
									>
										{isFollowing ? 'Following' : 'Follow'}
									</button>
								</>
							)}
						</div>
					</div>

					<div className="space-y-3">
						<div className="space-y-0.5">
							<div className="flex items-center gap-2">
								<h2 className="font-display font-bold text-2xl md:text-3xl text-ink dark:text-cream tracking-tight leading-none">
									{user.name} {user.surname}
								</h2>
							</div>
							<p className="font-mono text-sm text-relay/80">@{user.username}</p>
						</div>

						{user.bio ? (
							<p className="font-body text-ink/90 dark:text-cream/90 text-[15px] leading-relaxed max-w-xl whitespace-pre-wrap py-1">
								{user.bio}
							</p>
						) : (
							<p className="text-ink-faint dark:text-cream-faint italic text-[14px] py-1">No bio yet...</p>
						)}

						<div className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-ink-muted dark:text-cream-muted text-sm">
							<div className="flex items-center gap-2 group cursor-pointer hover:text-relay transition-colors">
								<HiOutlineMail className="w-4 h-4 text-ink-faint dark:text-cream-faint group-hover:text-relay" />
								<span>{user.email}</span>
							</div>
							<div className="flex items-center gap-2">
								<HiOutlineCalendar className="w-4 h-4 text-ink-faint dark:text-cream-faint" />
								<span>Joined March 2026</span>
							</div>
						</div>

						<div className="flex gap-6 pt-3 border-t border-border-subtle dark:border-void-border w-full overflow-x-auto text-sm">
							<div className="hover:underline cursor-pointer group">
								<span className="font-display font-bold text-lg text-ink dark:text-cream leading-none mr-1">{user.following?.length || 0}</span>
								<span className="font-mono text-[10px] text-ink-muted dark:text-cream-muted uppercase tracking-wider group-hover:text-relay transition-colors whitespace-nowrap">Following</span>
							</div>
							<div className="hover:underline cursor-pointer group">
								<span className="font-display font-bold text-lg text-ink dark:text-cream leading-none mr-1">{user.followers?.length || 0}</span>
								<span className="font-mono text-[10px] text-ink-muted dark:text-cream-muted uppercase tracking-wider group-hover:text-relay transition-colors whitespace-nowrap">Followers</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<div className="flex border-b border-border-subtle dark:border-void-border mt-0 px-4 gap-2 overflow-x-auto scrollbar-hide bg-surface dark:bg-void">
				{['Posts', 'Replies', 'Media', 'Likes'].map((tab, idx) => (
					<button
						key={tab}
						className={`py-3.5 px-3 font-display font-semibold transition-all text-sm relative whitespace-nowrap ${idx === 0
							? 'text-relay'
							: 'text-ink-faint dark:text-cream-faint hover:text-ink-muted dark:hover:text-cream-muted'
							}`}
					>
						{tab}
						{idx === 0 && (
							<div className="absolute bottom-0 left-0 right-0 h-[2px] bg-signal rounded-t-full signal-glow" />
						)}
					</button>
				))}
			</div>

			<div className="flex flex-col bg-surface dark:bg-void">
				{postLoading ? (
					<div className="p-20 flex justify-center"><Spinner loading={postLoading} /></div>
				) : posts.length > 0 ? (
					posts.map((post) => (
						<PostCard
							key={post._id}
							post={post}
							onLike={handleLike}
							onUnlike={handleUnlike}
							onDeleted={handlePostDeleted}
							onUpdated={handlePostUpdated}
						/>
					))
				) : (
					<div className="p-24 text-center">
						<p className="font-display font-bold text-xl text-ink-faint dark:text-cream-faint tracking-tight mb-2">Ghost Town</p>
						<p className="text-sm text-ink-muted dark:text-cream-muted">This user hasn't posted anything yet.</p>
					</div>
				)}
			</div>

			<Modal isOpen={openModal} handlClose={setOpenModal} size="wide">
				<header className="text-center md:text-left mb-6 md:mb-5 md:pr-10">
					<h2 className="font-display font-bold text-2xl md:text-[1.65rem] text-ink dark:text-cream tracking-tight leading-tight">
						Edit Profile
					</h2>
					<p className="font-mono text-[10px] text-ink-faint dark:text-cream-faint uppercase tracking-wider mt-1.5">
						Redefine your social essence
					</p>
				</header>

				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_11.5rem] lg:grid-cols-[minmax(0,1fr)_12.5rem] gap-6 md:gap-7 md:items-start">
						<div className="bg-parchment-deep/40 dark:bg-void-surface/50 p-5 md:p-6 rounded-2xl border border-border-subtle dark:border-void-border">
							<Form errors={errors} register={register} dense />
						</div>

						<aside className="flex flex-col items-center gap-3 md:gap-4 md:border-l md:border-border-subtle dark:md:border-void-border md:pl-6 lg:pl-7 md:pt-1">
							<h3 className="font-mono text-[10px] text-ink-faint dark:text-cream-faint uppercase tracking-wider text-center md:text-left md:self-stretch">
								Profile Identity
							</h3>
							<ImagePicker
								variant="compact"
								value={getValues('image')}
								onChange={handleImage}
							/>
							<p className="hidden md:block font-mono text-[9px] text-ink-faint/80 dark:text-cream-faint/80 uppercase tracking-wider text-center leading-relaxed">
								JPG or PNG · click to replace
							</p>
						</aside>
					</div>

					<div className="flex items-center gap-3 mt-6 md:mt-5 md:pt-5 md:border-t md:border-border-subtle dark:md:border-void-border">
						<Button
							variant="outline"
							label="Discard"
							className="flex-1 !py-2.5 !rounded-xl font-display font-semibold text-sm"
							onClick={() => setOpenModal(false)}
						/>
						<Button
							label="Refine Profile"
							type="submit"
							loading={userLoading}
							className="flex-1 !py-2.5 !rounded-xl font-display font-semibold text-sm relay-glow"
						/>
					</div>
				</form>
			</Modal>
		</div>
	);
};
