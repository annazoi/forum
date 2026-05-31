import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
    HiHeart, HiChatAlt, HiUserAdd,
    HiCheckCircle, HiBell, HiRefresh,
} from 'react-icons/hi';
import { authStore } from '../../store/auth';
import { useNotificationsHook, Notification } from '../../hooks/use-notifications';
import { Spinner } from '../../components/ui/Spinner';

const notificationIconMap = {
    like: { icon: HiHeart, bg: 'bg-relay/10 dark:bg-relay/20', color: 'text-relay' },
    comment: { icon: HiChatAlt, bg: 'bg-signal/10 dark:bg-signal/20', color: 'text-signal' },
    follow: { icon: HiUserAdd, bg: 'bg-relay/10 dark:bg-relay/20', color: 'text-relay' },
};

const notificationLink = (n: Notification): string => {
    if (n.type === 'follow') return `/profile/${n.sender._id}`;
    if (n.post) return `/post/${n.post._id}`;
    return '#';
};

interface NotificationItemProps {
    notification: Notification;
    onRead: (id: string) => void;
    index: number;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRead, index }) => {
    const { icon: Icon, bg, color } = notificationIconMap[notification.type];

    const handleClick = () => {
        if (!notification.read) {
            onRead(notification._id);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            exit={{ opacity: 0, x: -20 }}
            layout
        >
            <Link
                to={notificationLink(notification)}
                onClick={handleClick}
                className={`flex items-start gap-4 p-4 border-b border-border-subtle dark:border-void-border transition-all group relative ${notification.read
                        ? 'bg-surface dark:bg-void hover:bg-parchment-deep/30 dark:hover:bg-void-surface/50'
                        : 'bg-relay/5 dark:bg-relay/8 hover:bg-relay/8 dark:hover:bg-relay/12'
                    }`}
            >
                {!notification.read && (
                    <motion.div
                        layoutId={`dot-${notification._id}`}
                        className="absolute left-0 top-0 bottom-0 w-[3px] bg-signal rounded-r-full signal-glow"
                    />
                )}

                <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-xl bg-parchment-deep dark:bg-void-surface overflow-hidden border border-border-subtle dark:border-void-border">
                        {notification.sender.image ? (
                            <img src={notification.sender.image} alt={notification.sender.username} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-display font-bold text-lg text-ink-faint dark:text-cream-faint">
                                {notification.sender.username?.[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className={`absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full ${bg} flex items-center justify-center ring-4 ring-surface dark:ring-void`}>
                        <Icon className={`w-3 h-3 ${color}`} />
                    </div>
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                    <p className={`font-body text-[15px] leading-snug ${notification.read ? 'text-ink-muted dark:text-cream-muted' : 'text-ink dark:text-cream'}`}>
                        <span className="font-display font-semibold text-ink dark:text-cream hover:text-relay transition-colors">
                            {notification.sender.name} {notification.sender.surname}
                        </span>
                        {' '}
                        <span className={notification.read ? 'font-normal' : 'font-medium'}>
                            {notification.type === 'like' && 'liked your post'}
                            {notification.type === 'comment' && 'commented on your post'}
                            {notification.type === 'follow' && 'started following you'}
                        </span>
                    </p>

                    {notification.post && (
                        <div className="mt-2 p-3 rounded-xl bg-parchment-deep/50 dark:bg-void-surface/50 border border-border-subtle dark:border-void-border text-sm italic text-ink-muted dark:text-cream-muted line-clamp-2">
                            "{notification.post.description}"
                        </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                        <p className="font-mono text-[11px] text-ink-faint dark:text-cream-faint uppercase tracking-wider">
                            {notification.date ? formatDistanceToNow(new Date(notification.date), { addSuffix: true }) : ''}
                        </p>
                        {!notification.read && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-border dark:bg-void-border" />
                                <span className="font-mono text-[10px] font-medium text-signal uppercase tracking-wider">New</span>
                            </>
                        )}
                    </div>
                </div>

                {!notification.read && (
                    <div className="flex flex-col items-center gap-2">
                        <div className="shrink-0 w-2 h-2 rounded-full bg-signal mt-2 signal-glow" />
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="hidden group-hover:flex items-center justify-center p-1.5 rounded-lg bg-surface-elevated dark:bg-void-surface border border-border dark:border-void-border text-ink-faint dark:text-cream-faint hover:text-relay"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onRead(notification._id);
                            }}
                            title="Mark as read"
                        >
                            <HiCheckCircle className="w-4 h-4" />
                        </motion.button>
                    </div>
                )}
            </Link>
        </motion.div>
    );
};

export const Notifications: React.FC = () => {
    const isLoggedIn = authStore((s) => s.isLoggedIn);
    const { notifications, loading, unreadCount, fetchNotifications, markAllRead, markRead } = useNotificationsHook();
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        if (isLoggedIn) {
            fetchNotifications();
        }
    }, [fetchNotifications, isLoggedIn]);

    const filteredNotifications = useMemo(() => {
        if (filter === 'unread') return notifications.filter(n => !n.read);
        return notifications;
    }, [notifications, filter]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchNotifications();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    if (!isLoggedIn) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8">
                <div className="w-20 h-20 bg-relay/10 dark:bg-relay/20 rounded-2xl flex items-center justify-center mb-6">
                    <HiBell className="w-10 h-10 text-relay" />
                </div>
                <h2 className="font-display font-bold text-2xl text-ink dark:text-cream mb-3">Sign in to stay updated</h2>
                <p className="text-ink-muted dark:text-cream-muted max-w-xs mx-auto leading-relaxed">
                    Connect with others to see likes, comments, and new followers in your activity feed.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface dark:bg-void transition-colors">
            <div className="sticky top-0 z-40 bg-surface/85 dark:bg-void/85 backdrop-blur-xl">
                <div className="px-5 h-[52px] flex items-center justify-between border-b border-border-subtle dark:border-void-border">
                    <div className="flex items-center gap-2.5">
                        <h1 className="font-display font-bold text-[17px] tracking-tight text-ink dark:text-cream">Signals</h1>
                        {unreadCount > 0 && (
                            <motion.span
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="px-1.5 py-0.5 bg-relay text-white text-[10px] font-mono font-medium rounded-md tabular-nums"
                            >
                                {unreadCount}
                            </motion.span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            disabled={loading || isRefreshing}
                            className={`p-2 rounded-lg hover:bg-parchment-deep/60 dark:hover:bg-void-surface transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                        >
                            <HiRefresh className="w-5 h-5 text-ink-muted dark:text-cream-muted" />
                        </button>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-relay/10 text-xs font-display font-semibold text-relay hover:bg-relay hover:text-white transition-all"
                            >
                                <HiCheckCircle className="w-4 h-4" />
                                <span className="hidden sm:inline">Mark all read</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="px-4 py-2 flex items-center gap-2 border-b border-border-subtle dark:border-void-border overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3.5 py-1.5 rounded-lg font-display font-semibold text-xs transition-all whitespace-nowrap ${filter === 'all'
                                ? 'bg-ink text-cream dark:bg-cream dark:text-ink'
                                : 'text-ink-muted dark:text-cream-muted hover:bg-parchment-deep/60 dark:hover:bg-void-surface'
                            }`}
                    >
                        All Activity
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-3.5 py-1.5 rounded-lg font-display font-semibold text-xs transition-all whitespace-nowrap flex items-center gap-2 ${filter === 'unread'
                                ? 'bg-relay text-white'
                                : 'text-ink-muted dark:text-cream-muted hover:bg-parchment-deep/60 dark:hover:bg-void-surface'
                            }`}
                    >
                        Unread
                        {unreadCount > 0 && (
                            <span className={`w-1.5 h-1.5 rounded-full ${filter === 'unread' ? 'bg-white' : 'bg-signal'}`} />
                        )}
                    </button>
                </div>
            </div>

            <div className="pb-10">
                {loading && notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                        <Spinner loading={loading} />
                        <p className="font-mono text-[11px] text-ink-faint dark:text-cream-faint uppercase tracking-wider animate-pulse">
                            Syncing activity...
                        </p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-40 text-center px-8"
                    >
                        <div className="w-16 h-16 bg-parchment-deep/50 dark:bg-void-surface/50 rounded-2xl flex items-center justify-center mb-5 border border-border-subtle dark:border-void-border">
                            <HiBell className="w-8 h-8 text-ink-faint dark:text-cream-faint" />
                        </div>
                        <h3 className="font-display font-bold text-lg text-ink dark:text-cream mb-2 tracking-tight">
                            {filter === 'unread' ? 'No unread activity' : 'Nothing to show'}
                        </h3>
                        <p className="text-ink-muted dark:text-cream-muted text-sm max-w-[240px] leading-relaxed mx-auto">
                            {filter === 'unread'
                                ? "You've caught up with everything. Good job!"
                                : "Your activity feed is empty. Interact with posts to see updates here."}
                        </p>
                        {filter === 'unread' && (
                            <button
                                onClick={() => setFilter('all')}
                                className="mt-5 font-display font-semibold text-xs text-relay hover:underline underline-offset-4"
                            >
                                View all history
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <div className="flex flex-col">
                        <AnimatePresence mode="popLayout">
                            {filteredNotifications.map((n, i) => (
                                <NotificationItem
                                    key={n._id}
                                    notification={n}
                                    onRead={markRead}
                                    index={i}
                                />
                            ))}
                        </AnimatePresence>

                        {!loading && filteredNotifications.length > 5 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                className="text-center py-12 border-t border-border-subtle dark:border-void-border mt-4"
                            >
                                <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-parchment-deep/50 dark:bg-void-surface/50 border border-border-subtle dark:border-void-border">
                                    <HiCheckCircle className="w-4 h-4 text-signal" />
                                    <p className="font-mono text-[10px] text-ink-faint dark:text-cream-faint uppercase tracking-wider">
                                        End of activity history
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
