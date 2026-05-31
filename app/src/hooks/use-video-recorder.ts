import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_SECONDS = 60;
const MAX_FILE_BYTES = 100 * 1024 * 1024;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|mkv|3gp)$/i;

function isVideoFile(file: File) {
	return file.type.startsWith('video/') || VIDEO_EXT.test(file.name);
}

function pickMimeType() {
	const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
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

	const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
	const [recording, setRecording] = useState(false);
	const [seconds, setSeconds] = useState(0);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
	const [error, setError] = useState<string | null>(null);

	const stopStream = useCallback(() => {
		streamRef.current?.getTracks().forEach((t) => t.stop());
		streamRef.current = null;
	}, []);

	const clearPreview = useCallback(() => {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		setPreviewUrl(null);
		setVideoBlob(null);
		setSeconds(0);
	}, [previewUrl]);

	const startCamera = useCallback(async () => {
		setError(null);
		stopStream();
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode, width: { ideal: 720 }, height: { ideal: 1280 } },
				audio: true,
			});
			streamRef.current = stream;
			return stream;
		} catch {
			setError('Camera access denied');
			return null;
		}
	}, [facingMode, stopStream]);

	const stopRecording = useCallback(() => {
		if (timerRef.current) {
			window.clearInterval(timerRef.current);
			timerRef.current = null;
		}
		recorderRef.current?.stop();
		setRecording(false);
	}, []);

	const startRecording = useCallback(async () => {
		const stream = streamRef.current ?? (await startCamera());
		if (!stream) return;

		chunksRef.current = [];
		clearPreview();

		const mimeType = pickMimeType();
		const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
		recorderRef.current = recorder;

		recorder.ondataavailable = (e) => {
			if (e.data.size > 0) chunksRef.current.push(e.data);
		};

		recorder.onstop = () => {
			const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
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
	}, [startCamera, clearPreview, stopStream, stopRecording]);

	const flipCamera = useCallback(() => {
		setFacingMode((m) => (m === 'user' ? 'environment' : 'user'));
	}, []);

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
			stopRecording();
			stopStream();
			clearPreview();
			setError(null);
			setVideoBlob(file);
			setPreviewUrl(URL.createObjectURL(file));
		},
		[stopRecording, stopStream, clearPreview],
	);

	useEffect(() => {
		return () => {
			stopRecording();
			stopStream();
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	}, [stopRecording, stopStream, previewUrl]);

	return {
		facingMode,
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
		clearPreview,
		stopStream,
	};
}