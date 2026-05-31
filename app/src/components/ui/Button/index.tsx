import React from 'react';

interface ButtonProps {
	type?: 'button' | 'submit' | 'reset';
	label: React.ReactNode;
	onClick?: () => void;
	style?: React.CSSProperties;
	className?: string;
	variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
	disabled?: boolean;
	loading?: boolean;
	icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
	type = 'button',
	label,
	onClick,
	style,
	className = '',
	variant = 'primary',
	disabled = false,
	loading = false,
	icon,
}) => {
	const baseStyles =
		'inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-display font-semibold text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface dark:focus:ring-offset-void disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]';

	const variants = {
		primary: 'bg-relay text-white hover:bg-relay-hover focus:ring-relay/40 relay-glow',
		secondary:
			'bg-surface-elevated dark:bg-void-surface text-ink dark:text-cream border border-border dark:border-void-border hover:bg-parchment-deep dark:hover:bg-void-elevated focus:ring-ink-faint/30',
		outline:
			'bg-transparent text-relay border border-relay/40 hover:bg-relay/8 focus:ring-relay/30',
		ghost:
			'bg-transparent text-ink-muted dark:text-cream-muted hover:bg-parchment-deep/60 dark:hover:bg-void-surface focus:ring-ink-faint/20',
	};

	return (
		<button
			style={style}
			onClick={onClick}
			className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`}
			type={type}
			disabled={disabled || loading}
		>
			{loading ? (
				<svg
					className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
					<path
						className="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			) : null}
			{label}
			{icon && !loading && icon}
		</button>
	);
};
