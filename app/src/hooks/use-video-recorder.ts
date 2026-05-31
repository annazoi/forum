import { useCallback, useEffect, useRef, useState } from 'react';
import { Runner } from '@vysmo/effects';
import {
	getVideoFilter,
	usesCanvasPipeline,
	VIDEO_FILTERS,
	type VideoFilterId,
} from '../lib/video-filters';

const MAX_SECONDS = 60;
const MAX_FILE_BYTES = 100 * 1024 * 1024;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|mkv|3gp)$/i;

function isVideoFile(file: File) {
	return file.type.startsWith('video/') || VIDEO_EXT.test(file.name);
}

function pickMimeType(forCanvas = false) {
	const types = forCanvas
		? ['video/webm;codecs=vp8', 'video/webm']
		: ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
	for (const type of types) {
		if (MediaRecorder.isTypeSupported(type)) return type;
	}
	return '';
}

export function useVideoRecorder() {
	const streamRef = useRef<MediaStream | null>(null);
	const recorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<Blob[]>([]);
	const timerRef = useRef<number | null>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const sourceVideoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const runnerRef = useRef<Runner | null>(null);
	const rafRef = useRef<number>(0);
	const filteredStreamRef = useRef<MediaStream | null>(null);

	const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
	const [filterId, setFilterId] = useState<VideoFilterId>('none');
	const [recording, setRecording] = useState(false);
	const [seconds, setSeconds] = useState(0);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
	const [error, setError] = useState<string | null>(null);

	const stopFilterPipeline = useCallback(() => {
		if (rafRef.current) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = 0;
		}
		if (filteredStreamRef.current) {
			filteredStreamRef.current.getVideoTracks().forEach((t) => t.stop());
			filteredStreamRef.current = null;
		}
		runnerRef.current?.dispose();
		runnerRef.current = null;
		if (sourceVideoRef.current) sourceVideoRef.current.srcObject = null;
	}, []);

	const stopStream = useCallback(() => {
		stopFilterPipeline();
		streamRef.current?.getTracks().forEach((t) => t.stop());
		streamRef.current = null;
		if (videoRef.current) videoRef.current.srcObject = null;
	}, [stopFilterPipeline]);

	const clearPreview = useCallback(() => {
		setPreviewUrl(null);
		setVideoBlob(null);
		setSeconds(0);
	}, []);

	const ensureCanvasStream = useCallback((stream: MediaStream, canvas: HTMLCanvasElement) => {
		if (!filteredStreamRef.current) {
			const canvasStream = canvas.captureStream(30);
			const audio = stream.getAudioTracks()[0];
			if (audio) canvasStream.addTrack(audio);
			filteredStreamRef.current = canvasStream;
		}
	}, []);

	const attachStream = useCallback(
		(stream: MediaStream) => {
			stopFilterPipeline();

			const preset = getVideoFilter(filterId);
			if (preset.kind === 'none') {
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
					videoRef.current.play().catch(() => {});
				}
				return;
			}

			const sourceVideo = sourceVideoRef.current;
			const canvas = canvasRef.current;
			if (!sourceVideo || !canvas || !preset.effect) return;

			sourceVideo.srcObject = stream;
			sourceVideo.play().then(() => {
				if (!runnerRef.current) {
					runnerRef.current = new Runner({
						canvas,
						contextAttributes: { preserveDrawingBuffer: true },
					});
				}

				const draw = () => {
					if (sourceVideo.readyState >= 2 && preset.effect && runnerRef.current) {
						const w = sourceVideo.videoWidth || 720;
						const h = sourceVideo.videoHeight || 1280;
						if (canvas.width !== w || canvas.height !== h) {
							canvas.width = w;
							canvas.height = h;
						}
						runnerRef.current.render(preset.effect, {
							source: sourceVideo,
							params: preset.params ?? {},
						});
					}
					rafRef.current = requestAnimationFrame(draw);
				};

				ensureCanvasStream(stream, canvas);
				rafRef.current = requestAnimationFrame(draw);
			}).catch(() => {});
		},
		[filterId, stopFilterPipeline, ensureCanvasStream],
	);

	const getRecordStream = useCallback(() => {
		if (usesCanvasPipeline(filterId) && filteredStreamRef.current) {
			return filteredStreamRef.current;
		}
		return streamRef.current;
	}, [filterId]);

	const startCamera = useCallback(async (overrideFacing?: 'user' | 'environment') => {
		const mode = overrideFacing ?? facingMode;
		setError(null);
		stopStream();
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: mode, width: { ideal: 720 }, height: { ideal: 1280 } },
				audio: true,
			});
			streamRef.current = stream;
			if (overrideFacing) setFacingMode(overrideFacing);
			attachStream(stream);
			return stream;
		} catch {
			setError('Camera access denied');
			return null;
		}
	}, [facingMode, stopStream, attachStream]);

	useEffect(() => {
		if (streamRef.current) attachStream(streamRef.current);
	}, [filterId, attachStream]);

	const stopRecording = useCallback(() => {
		if (timerRef.current) {
			window.clearInterval(timerRef.current);
			timerRef.current = null;
		}
		recorderRef.current?.stop();
		setRecording(false);
	}, []);

	const startRecording = useCallback(async () => {
		const usingCanvas = usesCanvasPipeline(filterId);
		const stream = getRecordStream() ?? streamRef.current ?? (await startCamera());
		if (!stream) return;

		chunksRef.current = [];
		clearPreview();

		const mimeType = pickMimeType(usingCanvas);
		const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
		recorderRef.current = recorder;

		recorder.ondataavailable = (e) => {
			if (e.data.size > 0) chunksRef.current.push(e.data);
		};

		recorder.onstop = () => {
			const type = recorderRef.current?.mimeType || mimeType || 'video/webm';
			const blob = new Blob(chunksRef.current, { type });
			if (blob.size === 0) {
				setError('Recording failed — try again');
				stopStream();
				return;
			}
			setVideoBlob(blob);
			setPreviewUrl(URL.createObjectURL(blob));
			stopStream();
		};

		recorder.start(250);
		setRecording(true);
		setSeconds(0);

		timerRef.current = window.setInterval(() => {
			setSeconds((s) => {
				if (s + 1 >= MAX_SECONDS) {
					stopRecording();
					return MAX_SECONDS;
				}
				return s + 1;
			});
		}, 1000);
	}, [filterId, getRecordStream, startCamera, clearPreview, stopStream, stopRecording]);

	const flipCamera = useCallback(async () => {
		const next = facingMode === 'user' ? 'environment' : 'user';
		stopStream();
		await startCamera(next);
	}, [facingMode, stopStream, startCamera]);

	const loadBlob = useCallback(
		(blob: Blob) => {
			stopRecording();
			stopStream();
			clearPreview();
			setError(null);
			setVideoBlob(blob);
			setPreviewUrl(URL.createObjectURL(blob));
		},
		[stopRecording, stopStream, clearPreview],
	);

	const loadFile = useCallback(
		(file: File) => {
			if (!isVideoFile(file)) {
				setError('Please pick a video file');
				return;
			}
			if (file.size > MAX_FILE_BYTES) {
				setError('Video must be under 100MB');
				return;
			}
			loadBlob(file);
		},
		[loadBlob],
	);

	useEffect(() => {
		return () => {
			stopRecording();
			stopStream();
		};
	}, [stopRecording, stopStream]);

	useEffect(() => {
		const url = previewUrl;
		return () => {
			if (url) URL.revokeObjectURL(url);
		};
	}, [previewUrl]);

	return {
		facingMode,
		filterId,
		setFilterId,
		filters: VIDEO_FILTERS,
		videoRef,
		sourceVideoRef,
		canvasRef,
		recording,
		seconds,
		maxSeconds: MAX_SECONDS,
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
	};
}
