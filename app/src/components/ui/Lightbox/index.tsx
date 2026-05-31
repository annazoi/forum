import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiExternalLink } from 'react-icons/hi';
import { createPortal } from 'react-dom';

interface LightboxProps {
	isOpen: boolean;
	onClose: () => void;
	src: string;
	alt?: string;
}

export const Lightbox: React.FC<LightboxProps> = ({ isOpen, onClose, src, alt }) => {
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'auto';
		}
		return () => {
			document.body.style.overflow = 'auto';
		};
	}, [isOpen]);

	if (!isOpen) return null;

	return createPortal(
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-[100] flex items-center justify-center bg-void/95 backdrop-blur-md p-4 md:p-10"
				onClick={onClose}
			>
				<div
					className="absolute top-5 right-5 flex items-center gap-3 z-[110]"
					onClick={(e) => e.stopPropagation()}
				>
					<a
						href={src}
						download
						target="_blank"
						rel="noreferrer"
						className="p-2.5 bg-cream/10 hover:bg-cream/20 text-cream rounded-lg transition-all backdrop-blur-md border border-cream/10"
						title="Open original"
					>
						<HiExternalLink className="w-4 h-4" />
					</a>
					<button
						onClick={onClose}
						className="p-2.5 bg-cream/10 hover:bg-cream/20 text-cream rounded-lg transition-all backdrop-blur-md border border-cream/10"
					>
						<HiX className="w-5 h-5" />
					</button>
				</div>

				<motion.div
					initial={{ scale: 0.92, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.92, opacity: 0 }}
					transition={{ type: 'spring', damping: 28, stiffness: 280 }}
					className="relative max-w-full max-h-full flex items-center justify-center p-4 ring-1 ring-cream/10 rounded-xl"
					onClick={(e) => e.stopPropagation()}
				>
					<img
						src={src}
						alt={alt || 'Full screen preview'}
						className="max-w-full max-h-[85vh] object-contain rounded-lg select-none"
					/>
					<div className="absolute inset-0 bg-signal/8 blur-[100px] -z-10" />
				</motion.div>

				<EventListener onClose={onClose} />
			</motion.div>
		</AnimatePresence>,
		document.body,
	);
};

const EventListener = ({ onClose }: { onClose: () => void }) => {
	useEffect(() => {
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handleEsc);
		return () => window.removeEventListener('keydown', handleEsc);
	}, [onClose]);
	return null;
};
