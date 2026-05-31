import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
	HiX,
	HiRefresh,
	HiPhotograph,
	HiOutlineGlobeAlt,
	HiOutlineLockClosed,
	HiVideoCamera,
	HiPencil,
} from 'react-icons/hi';
import { useVideoRecorder } from '../../hooks/use-video-recorder';
import { usesCanvasPipeline } from '../../lib/video-filters';
import {
	TEXT_REEL_COLORS,
	generateTextReelVideo,
	getTextReelColor,
	type TextReelColorId,
} from '../../lib/text-reel';
import { FilterStrip } from './FilterStrip';
import { ColorStrip } from './ColorStrip';
import { Button } from '../ui/Button';
import { notify } from '../../utils/toast';

type CreateMode = 'video' | 'text';
type EditorStep = 'compose' | 'preview';

interface ReelEditorProps {
	onPublish: (video: Blob | File, description: string) => Promise<void>;
	onCancel: () => void;
	publishing?: boolean;
	visibility: 'public' | 'private';
	onVisibilityChange: (v: 'public' | 'private') => void;
	initialMode?: CreateMode;
}

export const ReelEditor: React.FC<ReelEditorProps> = ({
	onPublish,
	onCancel,
	publishing,
	visibility,
	onVisibilityChange,
	initialMode = 'video',
}) => {
	const fileRef = useRef<HTMLInputElement>(null);
	const previewVideoRef = useRef<HTMLVideoElement>(null);
	const [description, setDescription] = useState('');
	const [step, setStep] = useState<EditorStep>('compose');
	const [createMode, setCreateMode] = useState<CreateMode>(initialMode);
	const [textContent, setTextContent] = useState('');
	const [colorId, setColorId] = useState<TextReelColorId>('signal');
	const [generating, setGenerating] = useState(false);

	const selectedColor = getTextReelColor(colorId);

	const {
		recording,
		seconds,
		maxSeconds,
		previewUrl,
		videoBlob,
		error,
		startCamera,
		startRecording,
		stopRecording,
		flipCamera,
		loadFile,
		loadBlob,
		clearPreview,
		stopStream,
		facingMode,
		filterId,
		setFilterId,
		filters,
		videoRef,
		sourceVideoRef,
		canvasRef,
	} = useVideoRecorder();

	const usingFilter = usesCanvasPipeline(filterId);
	const mirrorCamera = facingMode === 'user';

	useEffect(() => {
		if (step !== 'compose' || createMode !== 'video' || previewUrl) return;
		startCamera();
		return () => stopStream();
	}, [step, createMode, previewUrl, startCamera, stopStream]);

	useEffect(() => {
		if (previewUrl && videoBlob) setStep('preview');
	}, [previewUrl, videoBlob]);

	useEffect(() => {
		if (step !== 'preview' || !previewUrl) return;
		const el = previewVideoRef.current;
		if (!el) return;
		el.src = previewUrl;
		el.load();
		const play = () => {
			el.play().catch(() => {
				el.muted = true;
				el.play().catch(() => {});
			});
		};
		if (el.readyState >= 2) play();
		else el.addEventListener('loadeddata', play, { once: true });
		return () => el.removeEventListener('loadeddata', play);
	}, [step, previewUrl]);

	const switchMode = (mode: CreateMode) => {
		if (mode === createMode || recording) return;
		if (mode === 'text') stopStream();
		setCreateMode(mode);
		if (mode === 'video' && step === 'compose') startCamera();
	};

	const handleRetake = () => {
		clearPreview();
		setDescription('');
		setStep('compose');
		if (createMode === 'video') startCamera();
	};

	const handleGenerateTextReel = async () => {
		if (!textContent.trim()) {
			notify.error('Add some text first');
			return;
		}
		setGenerating(true);
		try {
			const blob = await generateTextReelVideo({
				backgroundColor: selectedColor.color,
				textColor: selectedColor.textColor,
				text: textContent,
			});
			loadBlob(blob);
		} catch {
			notify.error('Could not create text reel');
		} finally {
			setGenerating(false);
		}
	};

	const handlePublish = async () => {
		if (!videoBlob) return;
		try {
			await onPublish(videoBlob, description);
		} catch {
			notify.error('Could not publish reel');
		}
	};

	const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

	const textFontSize =
		textContent.length <= 24 ? 'text-[2rem]' : textContent.length <= 60 ? 'text-[1.65rem]' : textContent.length <= 120 ? 'text-[1.35rem]' : 'text-[1.1rem]';

	return (
		<div className="relative flex flex-col h-[calc(100dvh-52px)] sm:h-[calc(100vh-52px)] bg-void-surface dark:bg-void overflow-hidden">
			<div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
				<button
					onClick={onCancel}
					className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white active:scale-95 transition-transform"
					aria-label="Close"
				>
					<HiX className="w-6 h-6" />
				</button>

				{step === 'compose' && (
					<div className="flex items-center gap-1 p-1 rounded-full bg-black/40 backdrop-blur-md">
						<button
							type="button"
							onClick={() => switchMode('video')}
							className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all ${
								createMode === 'video'
									? 'bg-white text-ink shadow-sm'
									: 'text-white/70 hover:text-white'
							}`}
						>
							<HiVideoCamera className="w-4 h-4" />
							Record
						</button>
						<button
							type="button"
							onClick={() => switchMode('text')}
							className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all ${
								createMode === 'text'
									? 'bg-white text-ink shadow-sm'
									: 'text-white/70 hover:text-white'
							}`}
						>
							<HiPencil className="w-4 h-4" />
							Text
						</button>
					</div>
				)}

				{step === 'compose' && createMode === 'video' && !recording ? (
					<button
						onClick={flipCamera}
						className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white active:scale-95 transition-transform"
						aria-label="Flip camera"
					>
						<HiRefresh className="w-6 h-6" />
					</button>
				) : (
					<div className="w-11" />
				)}
			</div>

			<div className="flex-1 relative overflow-hidden">
				{createMode === 'video' && (
					<video ref={sourceVideoRef} autoPlay muted playsInline className="hidden" />
				)}

				{step === 'compose' ? (
					createMode === 'video' ? (
						usingFilter ? (
							<canvas
								ref={canvasRef}
								className={`absolute inset-0 w-full h-full object-cover ${mirrorCamera ? 'scale-x-[-1]' : ''}`}
							/>
						) : (
							<video
								ref={videoRef}
								autoPlay
								muted
								playsInline
								className={`absolute inset-0 w-full h-full object-cover ${mirrorCamera ? 'scale-x-[-1]' : ''}`}
							/>
						)
					) : (
						<div
							className="absolute inset-0 grid content-center justify-items-center px-8 transition-colors duration-300"
							style={{ backgroundColor: selectedColor.color }}
						>
							<textarea
								value={textContent}
								onChange={(e) => setTextContent(e.target.value)}
								placeholder="Say something..."
								maxLength={280}
								rows={6}
								style={{ color: selectedColor.textColor }}
								className={`w-full max-w-md bg-transparent border-none outline-none resize-none text-center font-display font-bold leading-snug placeholder:opacity-40 content-center ${textFontSize}`}
							/>
						</div>
					)
				) : (
					previewUrl && (
						<video
							ref={previewVideoRef}
							key={previewUrl}
							autoPlay
							loop
							playsInline
							className="absolute inset-0 w-full h-full object-cover"
						/>
					)
				)}

				{createMode === 'video' && (
					<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
				)}

				{error && (
					<div className="absolute top-20 left-4 right-4 bg-relay/90 text-white text-sm font-body rounded-xl px-4 py-3 text-center">
						{error}
					</div>
				)}

				{step === 'compose' && createMode === 'video' && (
					<div className="absolute top-20 left-0 right-0 flex justify-center">
						{recording && (
							<motion.div
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								className="flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-4 py-2"
							>
								<span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
								<span className="font-mono text-white text-sm tabular-nums">
									{formatTime(seconds)} / {formatTime(maxSeconds)}
								</span>
							</motion.div>
						)}
					</div>
				)}

				{step === 'preview' && (
					<div className="absolute bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3">
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="What's happening?"
							rows={2}
							className="w-full font-body text-[16px] resize-none rounded-2xl px-4 py-3 bg-black/50 backdrop-blur-md border border-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-signal/50"
						/>

						<div className="flex items-center justify-between gap-3">
							<button
								type="button"
								onClick={() =>
									onVisibilityChange(visibility === 'public' ? 'private' : 'public')
								}
								className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/40 backdrop-blur-md text-white/80 text-xs font-mono uppercase tracking-wider"
							>
								{visibility === 'public' ? (
									<HiOutlineGlobeAlt className="w-4 h-4" />
								) : (
									<HiOutlineLockClosed className="w-4 h-4" />
								)}
								{visibility === 'public' ? 'Public' : 'Followers'}
							</button>

							<div className="flex gap-2 flex-1 justify-end">
								<Button
									label="Retake"
									variant="ghost"
									onClick={handleRetake}
									className="!text-white !bg-white/10 !border-white/20 !px-4"
								/>
								<Button
									label="Post"
									onClick={handlePublish}
									loading={publishing}
									disabled={publishing}
									className="!px-6"
								/>
							</div>
						</div>
					</div>
				)}
			</div>

			{step === 'compose' && createMode === 'video' && !recording && (
				<FilterStrip filters={filters} filterId={filterId} onSelect={setFilterId} />
			)}

			{step === 'compose' && createMode === 'text' && (
				<ColorStrip colors={TEXT_REEL_COLORS} colorId={colorId} onSelect={setColorId} />
			)}

			{step === 'compose' && createMode === 'video' && (
				<div className="shrink-0 flex items-center justify-center gap-10 pt-2 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] bg-black/60 backdrop-blur-sm">
					<input
						ref={fileRef}
						type="file"
						accept="video/*,.mp4,.mov,.webm,.m4v,.mkv,.3gp"
						className="hidden"
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) loadFile(file);
							e.target.value = '';
						}}
					/>
					<button
						onClick={() => fileRef.current?.click()}
						className="p-3 rounded-full bg-white/10 text-white active:scale-95 transition-transform"
						aria-label="Upload video"
					>
						<HiPhotograph className="w-7 h-7" />
					</button>

					<button
						onClick={() => (recording ? stopRecording() : startRecording())}
						className="relative flex items-center justify-center"
						aria-label={recording ? 'Stop recording' : 'Start recording'}
					>
						<div
							className={`w-[72px] h-[72px] rounded-full border-4 border-white flex items-center justify-center transition-all ${
								recording ? 'scale-110' : ''
							}`}
						>
							<motion.div
								animate={{
									borderRadius: recording ? '8px' : '9999px',
									width: recording ? 28 : 56,
									height: recording ? 28 : 56,
								}}
								transition={{ duration: 0.15 }}
								className="bg-red-500"
							/>
						</div>
					</button>

					<div className="w-[52px]" />
				</div>
			)}

			{step === 'compose' && createMode === 'text' && (
				<div className="shrink-0 flex items-center justify-center py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] bg-black/60 backdrop-blur-sm">
					<button
						type="button"
						onClick={handleGenerateTextReel}
						disabled={generating || !textContent.trim()}
						className="flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-signal text-white font-display font-semibold text-sm signal-glow active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
					>
						{generating ? (
							<svg
								className="animate-spin h-4 w-4"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
						) : null}
						{generating ? 'Creating…' : 'Create reel'}
					</button>
				</div>
			)}

		</div>
	);
};
