import React, { useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import type { Swiper as SwiperInstance } from 'swiper';
import type { VideoFilterId, VideoFilterPreset } from '../../lib/video-filters';
import 'swiper/css';

interface FilterStripProps {
	filters: VideoFilterPreset[];
	filterId: VideoFilterId;
	onSelect: (id: VideoFilterId) => void;
}

export const FilterStrip: React.FC<FilterStripProps> = ({ filters, filterId, onSelect }) => {
	const swiperRef = useRef<SwiperInstance | null>(null);

	useEffect(() => {
		const index = filters.findIndex((f) => f.id === filterId);
		if (index >= 0) swiperRef.current?.slideTo(index, 300);
	}, [filterId, filters]);

	return (
		<div className="relative shrink-0 border-t border-white/10 bg-black/50 backdrop-blur-sm reel-filter-rail">
			<div
				className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-black/90 via-black/40 to-transparent"
				aria-hidden
			/>
			<div
				className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-black/90 via-black/40 to-transparent"
				aria-hidden
			/>
			<Swiper
				onSwiper={(swiper) => {
					swiperRef.current = swiper;
				}}
				modules={[FreeMode]}
				freeMode={{ enabled: true, momentumRatio: 0.6, momentumVelocityRatio: 0.6 }}
				slidesPerView="auto"
				spaceBetween={14}
				slidesOffsetBefore={24}
				slidesOffsetAfter={24}
				className="reel-filter-swiper py-4"
			>
				{filters.map((filter) => {
					const active = filterId === filter.id;
					return (
						<SwiperSlide key={filter.id} className="!w-auto">
							<button
								type="button"
								onClick={() => onSelect(filter.id)}
								className="flex flex-col items-center gap-2 px-1 py-1 group"
								aria-label={`${filter.label} filter`}
								aria-pressed={active}
							>
								<span
									className={`w-12 h-12 rounded-full transition-all ${
										active
											? 'ring-2 ring-signal ring-offset-2 ring-offset-black scale-105'
											: 'ring-1 ring-white/20 group-active:scale-95'
									}`}
									style={{ background: filter.swatch }}
								/>
								<span
									className={`text-[10px] font-mono uppercase tracking-wider whitespace-nowrap ${
										active ? 'text-signal' : 'text-white/60'
									}`}
								>
									{filter.label}
								</span>
							</button>
						</SwiperSlide>
					);
				})}
			</Swiper>
		</div>
	);
};
