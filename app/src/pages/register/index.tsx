import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { registerSchema } from '../../validation-schemas/auth';
import { useAuthHook } from '../../hooks/authHook';
import { useEffect } from 'react';
import { authStore } from '../../store/auth';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ImagePicker } from '../../components/ui/ImagePicker';
import { themeStore } from '../../store/theme';
import { HiMoon, HiSun } from 'react-icons/hi';

interface RegisterFormData {
	name: string;
	surname: string;
	username: string;
	email: string;
	password: string;
	confirmPassword: string;
	image?: string;
	bio?: string;
}

export const Register = () => {
	const logIn = authStore((store) => store.logIn);
	const { registerUser, loading, error, data } = useAuthHook();
	const navigate = useNavigate();
	const isDark = themeStore((s) => s.isDark);
	const toggleTheme = themeStore((s) => s.toggle);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<RegisterFormData>({
		defaultValues: {
			name: '',
			surname: '',
			username: '',
			email: '',
			password: '',
			confirmPassword: '',
			image: '',
			bio: '',
		},
		resolver: yupResolver(registerSchema) as any,
	});

	useEffect(() => {
		if (!data) return;
		if (data.token) {
			logIn({
				token: data.token,
				userId: data.userId,
				image: data.image,
			});
			navigate('/home');
		}
	}, [data, logIn, navigate]);

	const onSubmit = (formData: RegisterFormData) => {
		registerUser(formData);
	};

	const handleImage = (image: string) => {
		setValue('image', image);
	};

	return (
		<div className="min-h-screen flex relative z-[1]">
			<div className="hidden lg:flex lg:w-[38%] bg-ink dark:bg-void-elevated relative overflow-hidden flex-col justify-between p-12 sticky top-0 h-screen">
				<div className="absolute inset-0 opacity-20">
					<div className="absolute top-1/3 -right-10 w-72 h-72 bg-signal rounded-full blur-[100px]" />
					<div className="absolute bottom-1/3 -left-10 w-56 h-56 bg-relay rounded-full blur-[80px]" />
				</div>

				<div className="relative flex items-center gap-3">
					<img src="/relay.png" alt="Relay" className="h-10 w-auto max-w-[5rem] rounded-md object-contain relay-glow" />
					<span className="font-display font-extrabold text-2xl text-cream tracking-tight">Relay</span>
				</div>

				<div className="relative space-y-4">
					<h1 className="font-display font-extrabold text-3xl text-cream leading-tight tracking-tight">
						Join the club
					</h1>
					<p className="font-body text-cream/60 leading-relaxed max-w-xs">
						Share stories, follow voices you trust, and relay what matters.
					</p>
				</div>

				<p className="relative font-mono text-[11px] text-cream/30 uppercase tracking-widest">
					Your signal starts here
				</p>
			</div>

			<div className="flex-1 py-10 px-6 sm:px-10 relative">
				<button
					onClick={toggleTheme}
					className="absolute top-5 right-5 p-2.5 rounded-lg hover:bg-parchment-deep/60 dark:hover:bg-void-surface transition-colors"
				>
					{isDark ? (
						<HiSun className="w-5 h-5 text-signal" />
					) : (
						<HiMoon className="w-5 h-5 text-ink-muted" />
					)}
				</button>

				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					className="max-w-xl mx-auto"
				>
				<div className="lg:hidden flex items-center gap-2.5 mb-8">
					<img src="/relay.png" alt="Relay" className="h-9 w-auto max-w-[4.5rem] rounded-md object-contain" />
						<span className="font-display font-extrabold text-xl text-ink dark:text-cream">Relay</span>
					</div>

					<div className="mb-8">
						<h2 className="font-display font-bold text-2xl text-ink dark:text-cream tracking-tight">
							Create your account
						</h2>
						<p className="mt-1.5 font-body text-ink-muted dark:text-cream-muted text-[15px]">
							A few details to get you started
						</p>
					</div>

					<form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
						<div className="space-y-4">
							<p className="font-mono text-[10px] text-ink-faint dark:text-cream-faint uppercase tracking-widest">
								Identity
							</p>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<Input name="name" placeholder="First name" label="First name" register={register} error={errors.name?.message} />
								<Input name="surname" placeholder="Last name" label="Last name" register={register} error={errors.surname?.message} />
							</div>
							<Input name="username" placeholder="your_handle" label="Username" register={register} error={errors.username?.message} />
							<Input name="email" type="email" placeholder="name@example.com" label="Email" register={register} error={errors.email?.message} />
							<div className="space-y-1.5">
								<label className="font-mono text-[10px] text-ink-faint dark:text-cream-faint uppercase tracking-widest ml-1 block">
									Bio
								</label>
								<textarea
									{...register('bio')}
									placeholder="A line about yourself..."
									className="w-full px-4 py-3 bg-surface-elevated dark:bg-void-surface border border-border dark:border-void-border rounded-xl text-ink dark:text-cream font-body placeholder:text-ink-faint/60 dark:placeholder:text-cream-faint/60 focus:outline-none focus:ring-2 focus:ring-relay/20 focus:border-relay/50 transition-all min-h-[80px] resize-none"
								/>
							</div>
						</div>

						<div className="space-y-4">
							<p className="font-mono text-[10px] text-ink-faint dark:text-cream-faint uppercase tracking-widest">
								Security
							</p>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<Input name="password" type="password" label="Password" placeholder="••••••••" register={register} error={errors.password?.message} />
								<Input name="confirmPassword" type="password" label="Confirm" placeholder="••••••••" register={register} error={errors.confirmPassword?.message} />
							</div>
						</div>

						<div className="space-y-4 flex flex-col items-center">
							<p className="font-mono text-[10px] text-ink-faint dark:text-cream-faint uppercase tracking-widest">
								Photo
							</p>
							<ImagePicker value={watch('image')} onChange={handleImage} />
						</div>

						{error && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="p-3.5 bg-relay/8 border border-relay/20 rounded-xl"
							>
								<p className="font-mono text-[11px] text-relay">{error}</p>
							</motion.div>
						)}

						<Button className="w-full !py-3" type="submit" loading={loading} label="Create account" />

						<p className="text-center font-body text-sm text-ink-muted dark:text-cream-muted">
							Already a member?{' '}
							<Link to="/login" className="font-display font-semibold text-relay hover:text-relay-hover transition-colors">
								Sign in
							</Link>
						</p>
					</form>
				</motion.div>
			</div>
		</div>
	);
};
