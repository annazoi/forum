import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { themeStore } from '../../store/theme';

export function Toast() {
	const isDark = themeStore((s) => s.isDark);

	return (
		<ToastContainer
			theme={isDark ? 'dark' : 'light'}
			position="top-center"
			autoClose={3200}
			hideProgressBar
			newestOnTop
			closeOnClick
			pauseOnHover
			draggable={false}
			limit={3}
			toastClassName="relay-toast"
			bodyClassName="relay-toast-body"
			progressClassName="relay-toast-progress"
		/>
	);
}
