import React from 'react';

interface SpinnerProps {
	loading: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({ loading }) => {
	if (!loading) return null;
	return (
		<div className="flex justify-center items-center py-4">
			<div className="relative w-8 h-8">
				<div className="absolute inset-0 rounded-full border-2 border-border dark:border-void-border" />
				<div className="absolute inset-0 rounded-full border-2 border-transparent border-t-relay border-r-signal animate-spin" />
			</div>
		</div>
	);
};
