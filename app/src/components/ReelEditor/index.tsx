import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
	HiX,
	HiRefresh,
	HiPhotograph,
	HiOutlineGlobeAlt,
	HiOutlineLockClosed,
} from 'react-icons/hi';
import { useVideoRecorder } from '../../hooks/use-video-recorder';
import { Button } from '../ui/Button';
import { notify } from '../../utils/toast';

interface ReelEditorProps {
	onPublish: (video: Blob | File, description: string) => Promise<void>;
	onCancel: () => void;
	publishing?: boolean;
	visibility: 'public' | 'private';
	onVisibilityChange: (v: 'public' | 'private') => void;
}

export const ReelEditor: React.FC<ReelEditorProps> = ({
	onPublish,
	onCancel,
	publishing,
	visibility,
	onVisibilityChange,
}) => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const fileRef = useRef<HTMLInputElement>(null);
	const [description, setDescription] = useState('');
	const [step, setStep] = useState<'record' | 'preview'>('record');

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
		clearPreview,
		stopStream,
		facingMode,
	} = useVideoRecorder();

	useEffect(() => {
		if (step !== 'record' || previewUrl) return;
		startCamera().then((stream) => {
			if (videoRef.current && stream) {
				videoRef.current.srcObject = stream;
			}
		});
		return () => stopStream();
	}, [step, previewUrl, facingMode, startCamera, stopStream]);

	useEffect(() => {
		if (previewUrl && videoBlob) setStep('preview');
	}, [previewUrl, videoBlob]);

	const handleRetake = () => {
		clearPreview();
		setDescription('');
		setStep('record');
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

	return (
		<div className="flex flex-col h-[calc(100dvh-52px)] sm:h-[calc(100vh-52px)] bg-void-surface dark:bg-void overflow-hidden">
			<div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
				<button
					onClick={onCancel}
					className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white active:scale-95 transition-transform"
					aria-label="Close"
				>
					<HiX className="w-6 h-6" />
				</button>

				{step === 'record' && !recording && (
					<button
						onClick={flipCamera}
						className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white active:scale-95 transition-transform"
						aria-label="Flip camera"
					>
						<HiRefresh className="w-6 h-6" />
					</button>
				)}
			</div>

			<div className="flex-1 relative overflow-hidden">
				{step === 'record' ? (
					<video
						ref={videoRef}
						autoPlay
						muted
						playsInline
						className="absolute inset-0 w-full h-full object-cover"
					/>
				) : (
					previewUrl && (
						<video
							src={previewUrl}
							autoPlay
							loop
							playsInline
							className="absolute inset-0 w-full h-full object-cover"
						/>
					)
				)}

				<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

				{error && (
					<div className="absolute top-20 left-4 right-4 bg-relay/90 text-white text-sm font-body rounded-xl px-4 py-3 text-center">
						{error}
					</div>
				)}

				{step === 'record' && (
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

			{step === 'record' && (
				<div className="shrink-0 flex items-center justify-center gap-10 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] bg-black/60 backdrop-blur-sm">
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
		</div>
	);
};
