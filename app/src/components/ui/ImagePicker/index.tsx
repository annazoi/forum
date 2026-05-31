import React, { useRef, useState, useEffect } from 'react';
import { HiOutlineCloudUpload } from 'react-icons/hi';

interface ImagePickerProps {
	name?: string;
	onChange: (base64: string) => void;
	children?: React.ReactNode;
	value?: string | null;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({ name = 'image', onChange, children, value }) => {
	const imageRef = useRef<HTMLInputElement>(null);
	const [image, setImage] = useState<string | null>(null);

	useEffect(() => {
		setImage(value || null);
	}, [value]);

	const handleImageClick = () => {
		imageRef.current?.click();
	};

	const handleImage = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			makeBase64(file).then((base64) => {
				setImage(base64);
				onChange(base64);
			});
		}
	};

	const makeBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const fileReader = new FileReader();
			fileReader.readAsDataURL(file);

			fileReader.onload = () => {
				resolve(fileReader.result as string);
			};

			fileReader.onerror = (error) => {
				reject(error);
			};
		});
	};

	return (
		<div className="flex flex-col items-center justify-center">
			{children}
			<input
				type="file"
				className="hidden"
				name={name}
				onChange={handleImage}
				accept="image/x-png,image/gif,image/jpeg, image/jpg, image/png"
				ref={imageRef}
			/>

			<div onClick={handleImageClick} className="relative cursor-pointer group">
				{image ? (
					<div className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-border dark:border-void-border group-hover:scale-[1.03] transition-transform duration-400">
						<img className="w-full h-full object-cover" src={image} alt={name} />
						<div className="absolute inset-0 bg-relay/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
							<HiOutlineCloudUpload className="w-8 h-8 text-white" />
						</div>
					</div>
				) : (
					<div className="w-32 h-32 bg-parchment-deep dark:bg-void-surface rounded-2xl flex flex-col items-center justify-center text-ink-muted dark:text-cream-muted border-2 border-dashed border-border dark:border-void-border group-hover:border-relay/50 group-hover:text-relay transition-all duration-300">
						<HiOutlineCloudUpload className="w-8 h-8 mb-2" />
						<span className="font-mono text-[10px] uppercase tracking-widest">Upload</span>
					</div>
				)}
			</div>
		</div>
	);
};
