import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { loginSchema } from '../../validation-schemas/auth';
import { useAuthHook } from '../../hooks/authHook';
import { useEffect } from 'react';
import { authStore } from '../../store/auth';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { themeStore } from '../../store/theme';
import { HiMoon, HiSun } from 'react-icons/hi';

interface LoginFormData {
	email: string;
	password: string;
}

export const Login = () => {
	const { logIn } = authStore((store) => store);
	const { loginUser, loading, error, data } = useAuthHook();
	const navigate = useNavigate();
	const isDark = themeStore((s) => s.isDark);
	const toggleTheme = themeStore((s) => s.toggle);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginFormData>({
		resolver: yupResolver(loginSchema),
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

	const onSubmit = (formData: LoginFormData) => {
		try {
			loginUser(formData);
		} catch (err) {
			console.error('Could not login', err);
		}
	};

	return (
		<div className="min-h-screen flex relative z-[1]">
			<div className="hidden lg:flex lg:w-[45%] bg-ink dark:bg-void-elevated relative overflow-hidden flex-col justify-between p-12">
				<div className="absolute inset-0 opacity-20">
					<div className="absolute top-1/4 -left-20 w-80 h-80 bg-relay rounded-full blur-[120px]" />
					<div className="absolute bottom-1/4 right-0 w-64 h-64 bg-signal rounded-full blur-[100px]" />
				</div>

				<div className="relative">
					<div className="flex items-center gap-3">
						<img
							src="/relay.png"
							alt="Relay"
							width={80}
							height={40}
							className="h-10 w-auto max-w-[5rem] rounded-md object-contain relay-glow"
						/>
						<span className="font-display font-extrabold text-2xl text-cream tracking-tight">Relay</span>
					</div>
				</div>

				<div className="relative space-y-6">
					<motion.h1
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
						className="font-display font-extrabold text-4xl xl:text-5xl text-cream leading-[1.1] tracking-tight"
					>
						Pass it on.
						<br />
						<span className="text-signal">Start the conversation.</span>
					</motion.h1>
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
						className="font-body text-cream/60 text-lg max-w-sm leading-relaxed"
					>
						A communication club for people who have something worth sharing.
					</motion.p>
				</div>

				<p className="relative font-mono text-[11px] text-cream/30 uppercase tracking-widest">
					Est. 2026
				</p>
			</div>

			<div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
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
					transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
					className="w-full max-w-md"
				>
					<div className="lg:hidden flex items-center gap-2.5 mb-8">
						<img
							src="/relay.png"
							alt="Relay"
							width={72}
							height={36}
							className="h-9 w-auto max-w-[4.5rem] rounded-md object-contain"
						/>
						<span className="font-display font-extrabold text-xl text-ink dark:text-cream">Relay</span>
					</div>

					<div className="mb-8">
						<h2 className="font-display font-bold text-2xl text-ink dark:text-cream tracking-tight">
							Welcome back
						</h2>
						<p className="mt-1.5 font-body text-ink-muted dark:text-cream-muted text-[15px]">
							Sign in to pick up where you left off
						</p>
					</div>

					<form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
						<Input
							name="email"
							type="text"
							placeholder="name@example.com"
							label="Email"
							register={register}
							error={errors.email?.message}
						/>
						<Input
							name="password"
							type="password"
							placeholder="••••••••"
							label="Password"
							register={register}
							error={errors.password?.message}
						/>

						{error && (
							<motion.div
								initial={{ opacity: 0, y: -4 }}
								animate={{ opacity: 1, y: 0 }}
								className="p-3.5 bg-relay/8 border border-relay/20 rounded-xl"
							>
								<p className="font-mono text-[11px] text-relay">{error}</p>
							</motion.div>
						)}

						<Button className="w-full !py-3" type="submit" loading={loading} label="Sign in" />
					</form>

					<p className="mt-8 text-center font-body text-sm text-ink-muted dark:text-cream-muted">
						No account yet?{' '}
						<Link
							to="/register"
							className="font-display font-semibold text-relay hover:text-relay-hover transition-colors"
						>
							Join Relay
						</Link>
					</p>
				</motion.div>
			</div>
		</div>
	);
};
