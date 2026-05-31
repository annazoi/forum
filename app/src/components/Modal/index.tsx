import React from 'react';
import { HiX } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
	isOpen: boolean;
	handlClose: (isOpen: boolean) => void;
	children: React.ReactNode;
	size?: 'default' | 'wide';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, handlClose, children, size = 'default' }) => {
	const widthClass = size === 'wide' ? 'max-w-xl md:max-w-3xl lg:max-w-4xl' : 'max-w-xl';
	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="absolute inset-0 bg-ink/50 dark:bg-black/70 backdrop-blur-sm"
						onClick={() => handlClose(false)}
					/>

					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 12 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 12 }}
						transition={{ type: 'spring', damping: 28, stiffness: 320 }}
						className={`bg-surface-elevated dark:bg-void-elevated w-full ${widthClass} rounded-2xl overflow-hidden relative z-10 border border-border dark:border-void-border shadow-2xl shadow-ink/10 dark:shadow-black/40`}
					>
						<button
							onClick={() => handlClose(false)}
							className="absolute top-4 right-4 p-2 hover:bg-parchment-deep dark:hover:bg-void-surface rounded-lg text-ink-faint dark:text-cream-faint hover:text-ink dark:hover:text-cream transition-all z-10"
						>
							<HiX className="w-5 h-5" />
						</button>

						<div className="p-6 md:p-8 overflow-y-auto max-h-[90vh] md:overflow-visible md:max-h-none">{children}</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
};
