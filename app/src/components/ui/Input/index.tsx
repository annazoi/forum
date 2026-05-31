import React from 'react';
import { UseFormRegister, FieldValues, Path } from 'react-hook-form';

interface InputProps<T extends FieldValues> {
	name: Path<T>;
	type?: string;
	placeholder?: string;
	value?: string;
	register?: UseFormRegister<T>;
	error?: string;
	className?: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	label?: string;
	props?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const Input = <T extends FieldValues>({
	name,
	type = 'text',
	placeholder,
	value,
	props,
	register,
	error,
	className = '',
	onChange,
	label,
}: InputProps<T>) => {
	return (
		<div className={`flex flex-col gap-1.5 w-full ${className}`}>
			{label && (
				<label className="font-mono text-[10px] text-ink-faint dark:text-cream-faint uppercase tracking-widest ml-1 mb-0.5 block">
					{label}
				</label>
			)}
			<input
				className={`w-full px-4 py-3 bg-surface-elevated dark:bg-void-surface border border-border dark:border-void-border rounded-xl text-ink dark:text-cream font-body placeholder:text-ink-faint/60 dark:placeholder:text-cream-faint/60 focus:outline-none focus:ring-2 focus:ring-relay/20 focus:border-relay/50 transition-all duration-300 ${
					error ? 'border-relay/60 focus:ring-relay/30' : ''
				}`}
				type={type}
				placeholder={placeholder}
				value={value}
				{...props}
				{...(register ? register(name) : {})}
				onChange={(e) => {
					if (onChange) onChange(e);
					if (register) register(name).onChange(e);
				}}
			/>
			{error && (
				<p className="font-mono text-[10px] text-relay mt-1 ml-1 uppercase tracking-wider">
					{error}
				</p>
			)}
		</div>
	);
};
