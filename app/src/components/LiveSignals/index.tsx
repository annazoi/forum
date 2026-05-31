import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { HiExternalLink, HiRefresh } from 'react-icons/hi';
import { useWorldNews } from '../../hooks/use-world-news';

export const LiveSignals: React.FC = () => {
	const { items, loading, error, refresh } = useWorldNews();

	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.15 }}
			className="bg-surface-elevated/60 dark:bg-void-elevated/60 border border-border-subtle dark:border-void-border rounded-2xl p-5 backdrop-blur-sm"
		>
			<div className="flex items-center justify-between gap-2 mb-5">
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
