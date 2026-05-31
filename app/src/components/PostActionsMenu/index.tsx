import React, { useEffect, useRef, useState } from 'react';
import { HiOutlineDotsHorizontal, HiOutlinePencilAlt, HiOutlineTrash } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../Modal';
import { Button } from '../ui/Button';
import { usePostHook } from '../../hooks/use-posts';
import { notify } from '../../utils/toast';

interface PostActionsMenuProps {
	postId: string;
	description?: string;
	visibility?: 'public' | 'private';
	isOwner: boolean;
	contentType?: 'post' | 'reel';
	variant?: 'default' | 'overlay';
	onDeleted?: (postId: string) => void;
	onUpdated?: (post: { _id: string; description?: string; visibility?: 'public' | 'private' }) => void;
}

export const PostActionsMenu: React.FC<PostActionsMenuProps> = ({
	postId,
	description = '',
	visibility = 'public',
	isOwner,
	contentType = 'post',
	variant = 'default',
	onDeleted,
	onUpdated,
}) => {
	const { deletePost, updatePost, loading } = usePostHook();
	const [open, setOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [editText, setEditText] = useState(description);
	const [editVisibility, setEditVisibility] = useState(visibility);
	const menuRef = useRef<HTMLDivElement>(null);

	const isReel = contentType === 'reel';
	const itemLabel = isReel ? 'reel' : 'post';
	const itemTitle = isReel ? 'Reel' : 'Post';

	useEffect(() => {
		setEditText(description);
		setEditVisibility(visibility);
	}, [description, visibility]);

	useEffect(() => {
		if (!open) return;
		const handleClick = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, [open]);

	if (!isOwner) return null;

	const triggerClass =
		variant === 'overlay'
			? 'p-2 text-white/90 hover:text-white bg-black/35 backdrop-blur-sm rounded-full transition-all'
			: 'p-1.5 text-ink-faint dark:text-cream-faint hover:text-relay hover:bg-relay/8 rounded-lg transition-all';

	const handleDelete = () => {
		setOpen(false);
		setDeleteOpen(true);
	};

	const confirmDelete = async () => {
		const result = await deletePost(postId);
		setDeleteOpen(false);
		if (result.deleted) {
			notify.success(`${itemTitle} deleted successfully`);
			onDeleted?.(postId);
		} else {
			notify.error(`Could not delete ${itemLabel}. Please try again.`);
		}
	};

	const handleSaveEdit = async () => {
		const result = await updatePost(postId, {
			description: editText,
			visibility: editVisibility,
		});
		if (result) {
			notify.success(`${itemTitle} updated successfully`);
			setEditOpen(false);
			onUpdated?.({ _id: postId, description: editText, visibility: editVisibility });
		} else {
			notify.error(`Could not update ${itemLabel}. Please try again.`);
		}
	};

	return (
		<>
			<div className="relative shrink-0" ref={menuRef}>
				<button
					type="button"
					aria-label="Post options"
					aria-expanded={open}
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						setOpen((v) => !v);
					}}
					className={triggerClass}
				>
					<HiOutlineDotsHorizontal className="w-4 h-4" />
				</button>

				<AnimatePresence>
					{open && (
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: -4 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: -4 }}
							className="absolute right-0 top-full mt-1 z-50 min-w-[140px] py-1 rounded-xl border border-border-subtle dark:border-void-border bg-surface-elevated dark:bg-void-elevated shadow-lg shadow-ink/10 dark:shadow-black/40"
							onClick={(e) => e.stopPropagation()}
						>
							<button
								type="button"
								onClick={() => {
									setOpen(false);
									setEditText(description);
									setEditVisibility(visibility);
									setEditOpen(true);
								}}
								className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[14px] text-ink dark:text-cream hover:bg-parchment-deep/60 dark:hover:bg-void-surface transition-colors"
							>
								<HiOutlinePencilAlt className="w-4 h-4 text-ink-muted dark:text-cream-muted" />
								Edit
							</button>
							<button
								type="button"
								onClick={handleDelete}
								className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[14px] text-relay hover:bg-relay/8 transition-colors"
							>
								<HiOutlineTrash className="w-4 h-4" />
								Delete
							</button>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<Modal isOpen={editOpen} handlClose={setEditOpen}>
				<h3 className="font-display font-bold text-lg text-ink dark:text-cream mb-4 pr-8">
					Edit {itemLabel}
				</h3>
				<textarea
					value={editText}
					onChange={(e) => setEditText(e.target.value)}
					rows={4}
					className="w-full font-body text-[15px] resize-none border border-border-subtle dark:border-void-border rounded-xl p-3 text-ink dark:text-cream bg-transparent focus:outline-none focus:ring-2 focus:ring-signal/30"
					placeholder={isReel ? 'Add a caption...' : "What's happening?"}
				/>
				<div className="flex gap-2 mt-3 mb-5">
					<button
						type="button"
						onClick={() => setEditVisibility('public')}
						className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider border transition-colors ${
							editVisibility === 'public'
								? 'border-relay/30 bg-relay/8 text-relay'
								: 'border-border-subtle dark:border-void-border text-ink-muted dark:text-cream-muted'
						}`}
					>
						Public
					</button>
					<button
						type="button"
						onClick={() => setEditVisibility('private')}
						className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider border transition-colors ${
							editVisibility === 'private'
								? 'border-relay/30 bg-relay/8 text-relay'
								: 'border-border-subtle dark:border-void-border text-ink-muted dark:text-cream-muted'
						}`}
					>
						Followers
					</button>
				</div>
				<div className="flex gap-2 justify-end">
					<Button label="Cancel" variant="ghost" onClick={() => setEditOpen(false)} />
					<Button label="Save" onClick={handleSaveEdit} loading={loading} disabled={loading} />
				</div>
			</Modal>

			<Modal isOpen={deleteOpen} handlClose={setDeleteOpen}>
				<h3 className="font-display font-bold text-lg text-ink dark:text-cream mb-2 pr-8">
					Delete {itemLabel}?
				</h3>
				<p className="font-body text-[15px] text-ink-muted dark:text-cream-muted leading-relaxed mb-6">
					This will permanently remove your {itemLabel}. This action cannot be undone.
				</p>
				<div className="flex gap-2 justify-end">
					<Button label="Cancel" variant="ghost" onClick={() => setDeleteOpen(false)} disabled={loading} />
					<Button
						label={`Delete ${itemTitle}`}
						onClick={confirmDelete}
						loading={loading}
						disabled={loading}
						className="!bg-relay hover:!bg-relay-hover"
					/>
				</div>
			</Modal>
		</>
	);
};
