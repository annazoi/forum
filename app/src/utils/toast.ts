import { toast, type ToastOptions } from 'react-toastify';

const base: ToastOptions = {
	position: 'top-center',
	autoClose: 3200,
	hideProgressBar: true,
	closeOnClick: true,
	pauseOnHover: true,
	className: 'relay-toast',
};

export const notify = {
	success: (message: string) => toast.success(message, base),
	error: (message: string) => toast.error(message, base),
	info: (message: string) => toast.info(message, base),
};
