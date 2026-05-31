export type TextReelColorId =
	| 'signal'
	| 'relay'
	| 'void'
	| 'coral'
	| 'gold'
	| 'violet'
	| 'sage'
	| 'cream'
	| 'sand'
	| 'ember';

export interface TextReelColor {
	id: TextReelColorId;
	label: string;
	color: string;
	textColor: string;
}

export const TEXT_REEL_COLORS: TextReelColor[] = [
	{ id: 'signal', label: 'Signal', color: '#0a9396', textColor: '#ffffff' },
	{ id: 'relay', label: 'Relay', color: '#005f73', textColor: '#ffffff' },
	{ id: 'void', label: 'Void', color: '#000a0c', textColor: '#d4e8ec' },
	{ id: 'coral', label: 'Coral', color: '#ef476f', textColor: '#ffffff' },
	{ id: 'gold', label: 'Gold', color: '#ffd166', textColor: '#001219' },
	{ id: 'violet', label: 'Violet', color: '#2d1b69', textColor: '#f4e8ff' },
	{ id: 'sage', label: 'Sage', color: '#94d2bd', textColor: '#001219' },
	{ id: 'cream', label: 'Cream', color: '#d4e8ec', textColor: '#001219' },
	{ id: 'sand', label: 'Sand', color: '#e8d5b7', textColor: '#001219' },
	{ id: 'ember', label: 'Ember', color: '#9b2226', textColor: '#ffe8e8' },
];

export const TEXT_REEL_WIDTH = 720;
export const TEXT_REEL_HEIGHT = 1280;
export const TEXT_REEL_DURATION = 5;

export function getTextReelColor(id: TextReelColorId): TextReelColor {
	return TEXT_REEL_COLORS.find((c) => c.id === id) ?? TEXT_REEL_COLORS[0];
}

function pickTextFontSize(charCount: number): number {
	if (charCount <= 24) return 56;
	if (charCount <= 60) return 44;
	if (charCount <= 120) return 36;
	return 28;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
	const paragraphs = text.split('\n');
	const lines: string[] = [];

	for (const paragraph of paragraphs) {
		const words = paragraph.trim().split(/\s+/).filter(Boolean);
		if (words.length === 0) {
			lines.push('');
			continue;
		}

		let current = words[0];
		for (let i = 1; i < words.length; i += 1) {
			const next = `${current} ${words[i]}`;
			if (ctx.measureText(next).width > maxWidth) {
				lines.push(current);
				current = words[i];
			} else {
				current = next;
			}
		}
		lines.push(current);
	}

	return lines;
}

export function drawTextReelFrame(
	ctx: CanvasRenderingContext2D,
	backgroundColor: string,
	textColor: string,
	text: string,
) {
	const { width, height } = ctx.canvas;
	ctx.fillStyle = backgroundColor;
	ctx.fillRect(0, 0, width, height);

	const trimmed = text.trim();
	if (!trimmed) return;

	const padding = 56;
	const maxWidth = width - padding * 2;
	const fontSize = pickTextFontSize(trimmed.length);

	ctx.fillStyle = textColor;
	ctx.font = `700 ${fontSize}px Syne, sans-serif`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	const lines = wrapLines(ctx, trimmed, maxWidth);
	const lineHeight = fontSize * 1.28;
	const totalHeight = lines.length * lineHeight;
	let y = height / 2 - totalHeight / 2 + lineHeight / 2;

	for (const line of lines) {
		ctx.fillText(line, width / 2, y);
		y += lineHeight;
	}
}

function pickMimeType() {
	const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
	for (const type of types) {
		if (MediaRecorder.isTypeSupported(type)) return type;
	}
	return '';
}

export async function generateTextReelVideo(options: {
	backgroundColor: string;
	textColor: string;
	text: string;
	durationSeconds?: number;
}): Promise<Blob> {
	const { backgroundColor, textColor, text, durationSeconds = TEXT_REEL_DURATION } = options;

	await document.fonts.load('700 56px Syne');

	const canvas = document.createElement('canvas');
	canvas.width = TEXT_REEL_WIDTH;
	canvas.height = TEXT_REEL_HEIGHT;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas unavailable');

	const draw = () => drawTextReelFrame(ctx, backgroundColor, textColor, text);
	draw();

	const stream = canvas.captureStream(30);
	const mimeType = pickMimeType();

	return new Promise((resolve, reject) => {
		const chunks: Blob[] = [];
		const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

		recorder.ondataavailable = (e) => {
			if (e.data.size > 0) chunks.push(e.data);
		};

		recorder.onstop = () => {
			const type = recorder.mimeType || mimeType || 'video/webm';
			const blob = new Blob(chunks, { type });
			if (blob.size === 0) {
				reject(new Error('Recording failed'));
				return;
			}
			resolve(blob);
		};

		recorder.onerror = () => reject(new Error('Recording failed'));

		recorder.start(250);
		const start = performance.now();
		const durationMs = durationSeconds * 1000;

		const loop = () => {
			draw();
			if (performance.now() - start < durationMs) {
				requestAnimationFrame(loop);
			} else {
				recorder.stop();
			}
		};

		requestAnimationFrame(loop);
	});
}
