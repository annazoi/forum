import React, { useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { HiExternalLink, HiRefresh } from 'react-icons/hi';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, A11y } from 'swiper/modules';
import { useWorldNewsContext } from '../../providers/world-news';
import 'swiper/css';
import 'swiper/css/pagination';

interface LiveSignalsProps {
	variant?: 'panel' | 'carousel';
	className?: string;
}

export const LiveSignals: React.FC<LiveSignalsProps> = ({ variant = 'panel', className = '' }) => {
	const { items, loading, error, refresh } = useWorldNewsContext();
	const dragRef = useRef(false);

	const openHeadline = (url: string) => {
		if (dragRef.current) return;
		window.open(url, '_blank', 'noopener,noreferrer');
	};

	const header = (
		<div className="flex items-center justify-between gap-2">
			<div className="flex items-center gap-2">
				<div className="w-2 h-2 rounded-full bg-signal animate-pulse-signal" />
				<h2 className="font-display font-bold text-[15px] text-ink dark:text-cream tracking-tight">
					Live Signals
				</h2>
			</div>
			<button
				onClick={refresh}
				disabled={loading}
				className="p-1.5 rounded-lg text-ink-faint dark:text-cream-faint hover:text-relay hover:bg-relay/8 transition-all disabled:opacity-40"
				aria-label="Refresh headlines"
			>
				<HiRefresh className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
			</button>
		</div>
	);

	if (variant === 'carousel') {
		return (
			<motion.section
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className={`relative px-4 py-4 ${className}`}
			>
				<div className="mb-3">{header}</div>

				{loading && items.length === 0 && (
					<div className="flex gap-3 overflow-hidden">
						{Array.from({ length: 3 }).map((_, i) => (
							<div
								key={i}
								className="shrink-0 w-[72vw] max-w-[280px] h-[108px] rounded-xl bg-parchment-deep/80 dark:bg-void-surface/80 animate-pulse border border-border-subtle dark:border-void-border"
							/>
						))}
					</div>
				)}

				{error && items.length === 0 && (
					<p className="font-body text-[13px] text-ink-muted dark:text-cream-muted leading-relaxed px-1">
						Headlines unavailable right now.
					</p>
				)}

				{items.length > 0 && (
					<div className="relative -mx-4 px-4 overflow-visible">
						<Swiper
							onTouchStart={() => {
								dragRef.current = false;
							}}
							onSliderMove={() => {
								dragRef.current = true;
							}}
							modules={[Pagination, A11y]}
							spaceBetween={12}
							slidesPerView={1.12}
							slidesPerGroup={1}
							nested
							grabCursor
							simulateTouch
							touchStartPreventDefault={false}
							touchReleaseOnEdges
							threshold={8}
							longSwipesRatio={0.3}
							pagination={{ clickable: true }}
							className="live-signals-swiper"
							a11y={{
								prevSlideMessage: 'Previous headline',
								nextSlideMessage: 'Next headline',
								paginationBulletMessage: 'Go to headline {{index}}',
							}}
						>
							{items.map((item, i) => (
								<SwiperSlide key={`${item.link}-${i}`}>
									<div
										role="link"
										tabIndex={0}
										onClick={() => openHeadline(item.link)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') openHeadline(item.link);
										}}
										className="group block h-full p-4 rounded-xl border border-border-subtle dark:border-void-border bg-surface-elevated/70 dark:bg-void-elevated/70 backdrop-blur-sm hover:border-signal/40 transition-colors cursor-pointer select-none"
									>
										<p className="font-mono text-[9px] text-signal uppercase tracking-widest mb-2 truncate">
											{item.source}
										</p>
										<p className="font-display font-semibold text-[14px] text-ink dark:text-cream group-hover:text-relay transition-colors leading-snug line-clamp-2 min-h-[2.5rem]">
											{item.title}
										</p>
										<div className="flex items-center gap-1.5 mt-2.5">
											<p className="font-mono text-[10px] text-ink-faint dark:text-cream-faint">
												{formatDistanceToNow(new Date(item.pubDate), { addSuffix: true })}
											</p>
											<HiExternalLink className="w-3 h-3 text-ink-faint dark:text-cream-faint opacity-60 group-hover:opacity-100 group-hover:text-relay transition-all" />
										</div>
									</div>
								</SwiperSlide>
							))}
						</Swiper>
					</div>
				)}

				<p className="mt-3 font-mono text-[9px] text-ink-faint dark:text-cream-faint uppercase tracking-wider px-1">
					BBC & NPR · Swipe for more
				</p>
			</motion.section>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.15 }}
			className={`bg-surface-elevated/60 dark:bg-void-elevated/60 border border-border-subtle dark:border-void-border rounded-2xl p-5 backdrop-blur-sm ${className}`}
		>
			<div className="mb-5">{header}</div>

			<div className="space-y-5">
				{loading && items.length === 0 && (
					<>
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className="space-y-2 animate-pulse">
								<div className="h-2.5 w-16 bg-parchment-deep dark:bg-void-surface rounded" />
								<div className="h-3.5 w-full bg-parchment-deep dark:bg-void-surface rounded" />
								<div className="h-2.5 w-20 bg-parchment-deep dark:bg-void-surface rounded" />
							</div>
						))}
					</>
				)}

				{error && items.length === 0 && (
					<p className="font-body text-[13px] text-ink-muted dark:text-cream-muted leading-relaxed">
						Headlines unavailable right now. Check back shortly.
					</p>
				)}

				{items.map((item, i) => (
					<a
						key={`${item.link}-${i}`}
						href={item.link}
						target="_blank"
						rel="noopener noreferrer"
						className="group block"
					>
						<p className="font-mono text-[10px] text-ink-faint dark:text-cream-faint uppercase tracking-wider mb-1">
							{item.source}
						</p>
						<p className="font-display font-semibold text-[14px] text-ink dark:text-cream group-hover:text-relay transition-colors leading-snug line-clamp-3">
							{item.title}
						</p>
						<div className="flex items-center gap-1.5 mt-1">
							<p className="font-mono text-[11px] text-ink-faint dark:text-cream-faint">
								{formatDistanceToNow(new Date(item.pubDate), { addSuffix: true })}
							</p>
							<HiExternalLink className="w-3 h-3 text-ink-faint dark:text-cream-faint opacity-0 group-hover:opacity-100 transition-opacity" />
						</div>
					</a>
				))}
			</div>

			<p className="mt-5 pt-4 border-t border-border-subtle dark:border-void-border font-mono text-[9px] text-ink-faint dark:text-cream-faint uppercase tracking-wider">
				World news via BBC & NPR
			</p>
		</motion.div>
	);
};
