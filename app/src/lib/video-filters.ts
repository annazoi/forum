import {
	bloom,
	colorGrade,
	duotone,
	glow,
	gradientMap,
	vhs,
	type Effect,
} from '@vysmo/effects';

export type VideoFilterId =
	| 'none'
	| 'vivid'
	| 'warm'
	| 'cool'
	| 'golden'
	| 'noir'
	| 'vhs'
	| 'dream'
	| 'sunset'
	| 'glow';

export type VideoFilterKind = 'none' | 'effect';

export interface VideoFilterPreset {
	id: VideoFilterId;
	label: string;
	swatch: string;
	kind: VideoFilterKind;
	effect?: Effect | null;
	params?: Record<string, number | readonly number[]>;
}

export const VIDEO_FILTERS: VideoFilterPreset[] = [
	{
		id: 'none',
		label: 'Normal',
		swatch: 'linear-gradient(135deg, #6b7280 0%, #d1d5db 100%)',
		kind: 'none',
	},
	{
		id: 'vivid',
		label: 'Vivid',
		swatch: 'linear-gradient(135deg, #ff006e 0%, #8338ec 100%)',
		kind: 'effect',
		effect: colorGrade,
		params: { contrast: 1.3, saturation: 1.45, brightness: 0.04 },
	},
	{
		id: 'warm',
		label: 'Warm',
		swatch: 'linear-gradient(135deg, #ff9a3c 0%, #ff6b6b 100%)',
		kind: 'effect',
		effect: colorGrade,
		params: { hue: 0.12, saturation: 1.2, brightness: 0.05, contrast: 1.05 },
	},
	{
		id: 'cool',
		label: 'Cool',
		swatch: 'linear-gradient(135deg, #4cc9f0 0%, #4361ee 100%)',
		kind: 'effect',
		effect: colorGrade,
		params: { hue: 5.5, saturation: 1.15, contrast: 1.1 },
	},
	{
		id: 'golden',
		label: 'Golden',
		swatch: 'linear-gradient(135deg, #ffd166 0%, #ef476f 100%)',
		kind: 'effect',
		effect: gradientMap,
		params: {
			intensity: 0.65,
			shadow: [0.08, 0.05, 0.02],
			midtone: [0.85, 0.45, 0.12],
			highlight: [1, 0.92, 0.65],
		},
	},
	{
		id: 'noir',
		label: 'Noir',
		swatch: 'linear-gradient(135deg, #1a1a1a 0%, #666666 100%)',
		kind: 'effect',
		effect: colorGrade,
		params: { saturation: 0, contrast: 1.35, brightness: -0.05 },
	},
	{
		id: 'vhs',
		label: 'VHS',
		swatch: 'linear-gradient(135deg, #2d1b69 0%, #11998e 100%)',
		kind: 'effect',
		effect: vhs,
		params: { intensity: 0.55, seed: 42 },
	},
	{
		id: 'dream',
		label: 'Dream',
		swatch: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
		kind: 'effect',
		effect: glow,
		params: { intensity: 0.85, threshold: 0.35, radius: 40, tint: [1, 0.85, 0.95] },
	},
	{
		id: 'sunset',
		label: 'Sunset',
		swatch: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
		kind: 'effect',
		effect: duotone,
		params: {
			intensity: 0.7,
			shadow: [0.35, 0.08, 0.25],
			highlight: [1, 0.75, 0.35],
		},
	},
	{
		id: 'glow',
		label: 'Glow',
		swatch: 'linear-gradient(135deg, #0a9396 0%, #94d2bd 100%)',
		kind: 'effect',
		effect: bloom,
		params: { intensity: 0.9, threshold: 0.65, radius: 24 },
	},
];

export function getVideoFilter(id: VideoFilterId): VideoFilterPreset {
	return VIDEO_FILTERS.find((f) => f.id === id) ?? VIDEO_FILTERS[0];
}

export function usesCanvasPipeline(id: VideoFilterId): boolean {
	return getVideoFilter(id).kind === 'effect';
}
