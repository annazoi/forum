import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '../ui/Input';

interface FormProps {
	register: UseFormRegister<any>;
	errors: FieldErrors<any>;
	dense?: boolean;
}

export const Form: React.FC<FormProps> = ({ register, errors, dense = false }) => {
	return (
		<div className={dense ? 'space-y-3 [&_input]:py-2.5' : 'space-y-5'}>
			<div className={`grid grid-cols-1 md:grid-cols-2 ${dense ? 'gap-3' : 'gap-4'}`}>
				<Input
					name="name"
					placeholder="First Name"
					label="First Name"
					register={register}
					error={errors.name?.message as string}
				/>
				<Input
					name="surname"
					placeholder="Surname"
					label="Surname"
					register={register}
					error={errors.surname?.message as string}
				/>
			</div>

			<Input
				name="username"
				placeholder="Username"
				label="Username"
				register={register}
				error={errors.username?.message as string}
			/>

			<Input
				name="email"
				placeholder="Email Address"
				label="Email"
				register={register}
				error={errors.email?.message as string}
			/>

			<div className="space-y-1.5 flex-1">
				<label className="font-mono text-[10px] text-ink-faint dark:text-cream-faint uppercase tracking-widest ml-1 mb-0.5 block">
					Bio
				</label>
				<textarea
					{...register('bio')}
					placeholder="Tell us about yourself..."
					className={`w-full bg-surface-elevated dark:bg-void-surface border border-border dark:border-void-border rounded-xl px-4 py-3 text-ink dark:text-cream font-body placeholder:text-ink-faint/60 dark:placeholder:text-cream-faint/60 focus:outline-none focus:ring-2 focus:ring-relay/20 focus:border-relay/50 transition-all resize-none ${dense ? 'min-h-[4.5rem] md:min-h-[4rem]' : 'min-h-[100px]'}`}
				/>
				{errors.bio && (
					<p className="font-mono text-[10px] text-relay ml-1 uppercase tracking-wider">
						{errors.bio.message as string}
					</p>
				)}
			</div>
		</div>
	);
};
