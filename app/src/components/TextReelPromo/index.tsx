import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiArrowRight } from 'react-icons/hi';

const STORAGE_KEY = 'relay-dismissed-text-reel-promo';

const PREVIEWS = [
	{ bg: '#0a9396', text: '#ffffff', line: 'Say it loud' },
	{ bg: '#ef476f', text: '#ffffff', line: 'Hot take' },
	{ bg: '#2d1b69', text: '#f4e8ff', line: 'Midnight thought' },
];

export const TextReelPromo: React.FC = () => {
	const navigate = useNavigate();
	const [visible, setVisible] = useState(() => !localStorage.getItem(STORAGE_KEY));
	const [activePreview, setActivePreview] = useState(0);

	useEffect(() => {
		if (!visible) return;
		const id = window.setInterval(() => {
			setActivePreview((p) => (p + 1) % PREVIEWS.length);
		}, 3200);
		return () => window.clearInterval(id);
	}, [visible]);

	const dismiss = () => {
		localStorage.setItem(STORAGE_KEY, '1');
		setVisible(false);
	};

	return (
		<AnimatePresence>
			{visible && (
				<motion.section
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
					transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
					className="relative mx-4 mt-4 mb-1 overflow-hidden rounded-2xl border border-border-subtle dark:border-void-border bg-surface-elevated dark:bg-void-elevated"
					onMouseEnter={() => setActivePreview((p) => (p + 1) % PREVIEWS.length)}
				>
					<div className="absolute inset-0 text-reel-promo-mesh pointer-events-none" aria-hidden />

					<button
						type="button"
						onClick={dismiss}
						className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-ink-faint dark:text-cream-faint hover:text-ink dark:hover:text-cream hover:bg-parchment-deep/60 dark:hover:bg-void-surface transition-colors"
						aria-label="Dismiss"
					>
						<HiX className="w-4 h-4" />
					</button>

					<div className="relative flex items-stretch gap-4 p-4 pr-10 sm:pr-4 sm:gap-6 sm:p-5">
						<div className="relative shrink-0 w-[88px] sm:w-[100px] self-center">
							{PREVIEWS.map((preview, i) => {
								const offset = (i - activePreview + PREVIEWS.length) % PREVIEWS.length;
								return (
									<motion.div
										key={preview.line}
										animate={{
											rotate: offset === 0 ? -4 : offset === 1 ? 6 : 12,
											x: offset * 6,
											y: offset * -4,
											scale: offset === 0 ? 1 : 0.92 - offset * 0.04,
											zIndex: 3 - offset,
										}}
										transition={{ type: 'spring', stiffness: 260, damping: 22 }}
										className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[72px] sm:w-[80px] aspect-[9/16] rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10 overflow-hidden"
										style={{ backgroundColor: preview.bg }}
									>
										<div className="absolute inset-0 flex items-center justify-center p-2">
											<p
												className="font-display font-bold text-[9px] sm:text-[10px] leading-tight text-center"
												style={{ color: preview.text }}
											>
												{preview.line}
											</p>
										</div>
									</motion.div>
								);
							})}
							<div className="aspect-[9/16] w-[72px] sm:w-[80px] opacity-0 pointer-events-none" aria-hidden />
						</div>

						<div className="flex-1 min-w-0 flex flex-col justify-center py-1">
							<div className="flex items-center gap-2 mb-2">
								<span className="inline-flex items-center px-2 py-0.5 rounded-md bg-signal/15 text-signal text-[10px] font-mono font-medium uppercase tracking-widest">
									New
								</span>
								<span className="text-[10px] font-mono uppercase tracking-wider text-ink-faint dark:text-cream-faint">
									Text reels
								</span>
							</div>

							<h2 className="font-display font-bold text-[1.15rem] sm:text-xl text-ink dark:text-cream tracking-tight leading-snug mb-1.5">
								Your words, full screen
							</h2>

							<p className="font-body text-[13px] sm:text-sm text-ink-muted dark:text-cream-muted leading-relaxed mb-4 max-w-[280px]">
								Pick a color, type a thought, post it as a reel - no camera needed.
							</p>

							<button
								type="button"
								onClick={() => navigate('/reels?create=text')}
								className="inline-flex items-center gap-2 self-start px-4 py-2.5 rounded-xl bg-relay text-white font-display font-semibold text-sm relay-glow active:scale-[0.98] transition-transform"
							>
								Try text reels
								<HiArrowRight className="w-4 h-4" />
							</button>
						</div>
					</div>
				</motion.section>
			)}
		</AnimatePresence>
	);
};
