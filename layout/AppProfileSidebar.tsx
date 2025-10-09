import { Badge } from "primereact/badge";
import { Sidebar } from "primereact/sidebar";
import { useContext, useState, useEffect } from "react";
import { LayoutContext } from "./context/layoutcontext";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Avatar } from "primereact/avatar";
import { Skeleton } from "primereact/skeleton";
import { useTranslation } from "@/hooks/useTranslation";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

interface Message {
    id: string;
    content: string;
    createdAt: string;
    sender: {
        id: string;
        firstName: string;
        lastName: string;
        profileImage?: string;
    };
}

const AppProfileSidebar = () => {
    const { layoutState, setLayoutState } = useContext(LayoutContext);
    const { data: session } = useSession();
    const user = session?.user;
    const router = useRouter();
    const { t } = useTranslation();
    
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    const onProfileSidebarHide = () => {
        setLayoutState((prevState) => ({
            ...prevState,
            profileSidebarVisible: false,
        }));
    };

    useEffect(() => {
        if (layoutState.profileSidebarVisible && user?.id) {
            loadSidebarData();
        }
    }, [layoutState.profileSidebarVisible, user?.id]);

    const loadSidebarData = async () => {
        setLoading(true);
        try {
            // For now, we'll use mock data since we don't have the API client yet
            setNotifications([]);
            setMessages([]);
        } catch (error) {
            console.error('Error loading sidebar data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await signOut({ redirect: false });
        router.push('/auth/login');
    };

    const handleProfileClick = () => {
        router.push('/admin/profile');
        onProfileSidebarHide();
    };

    const handleSettingsClick = () => {
        router.push('/admin/settings');
        onProfileSidebarHide();
    };

    const handleNotificationClick = (notificationId: string) => {
        // Mark as read and navigate to notifications page
        router.push('/admin/notifications');
        onProfileSidebarHide();
    };

    const handleMessageClick = () => {
        router.push('/admin/communications');
        onProfileSidebarHide();
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'GAME_UPDATE': return 'pi-gamepad';
            case 'PAYMENT_RECEIVED': return 'pi-credit-card';
            case 'CHAT_MESSAGE': return 'pi-comments';
            case 'BROADCAST': return 'pi-bell';
            case 'SUPPORT_RESPONSE': return 'pi-question-circle';
            default: return 'pi-bell';
        }
    };

    return (
        <Sidebar
            visible={layoutState.profileSidebarVisible}
            onHide={onProfileSidebarHide}
            position="right"
            className="layout-profile-sidebar w-full sm:w-25rem"
        >
            <div className="flex flex-column mx-auto md:mx-0">
                <span className="mb-2 font-semibold">{t('profile.welcome')}</span>
                <span className="text-color-secondary font-medium mb-5">
                    {user ? `${user.firstName} ${user.lastName}` : t('profile.adminUser')}
                </span>

                <ul className="list-none m-0 p-0">
                    <li>
                        <button 
                            onClick={handleProfileClick}
                            className="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150 w-full text-left"
                        >
                            <span>
                                <i className="pi pi-user text-xl text-primary"></i>
                            </span>
                            <div className="ml-3">
                                <span className="mb-2 font-semibold">
                                    {t('profile.profile')}
                                </span>
                                <p className="text-color-secondary m-0">
                                    {t('profile.manageAccountSettings')}
                                </p>
                            </div>
                        </button>
                    </li>
                    {/* <li>
                        <button 
                            onClick={handleSettingsClick}
                            className="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150 w-full text-left"
                        >
                            <span>
                                <i className="pi pi-cog text-xl text-primary"></i>
                            </span>
                            <div className="ml-3">
                                <span className="mb-2 font-semibold">
                                    {t('profile.settings')}
                                </span>
                                <p className="text-color-secondary m-0">
                                    {t('profile.configureSystemPreferences')}
                                </p>
                            </div>
                        </button>
                    </li> */}
                    <li>
                        <button 
                            onClick={handleSignOut}
                            className="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150 w-full text-left"
                        >
                            <span>
                                <i className="pi pi-power-off text-xl text-primary"></i>
                            </span>
                            <div className="ml-3">
                                <span className="mb-2 font-semibold">
                                    {t('profile.signOut')}
                                </span>
                                <p className="text-color-secondary m-0">
                                    {t('profile.logoutFromAccount')}
                                </p>
                            </div>
                        </button>
                    </li>
                </ul>
            </div>

            <div className="flex flex-column mt-5 mx-auto md:mx-0">
                <span className="mb-2 font-semibold">{t('profile.recentNotifications')}</span>
                <span className="text-color-secondary font-medium mb-5">
                    {loading ? (
                        <Skeleton width="60%" height="1rem" />
                    ) : (
                        t('profile.unreadNotifications', { count: notifications.length })
                    )}
                </span>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex align-items-center p-3 border-1 surface-border border-round">
                                <Skeleton shape="circle" size="2rem" className="mr-3" />
                                <div className="flex-1">
                                    <Skeleton width="80%" height="1rem" className="mb-2" />
                                    <Skeleton width="60%" height="0.8rem" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length > 0 ? (
                    <ul className="list-none m-0 p-0">
                        {notifications.slice(0, 3).map((notification) => (
                            <li key={notification.id}>
                                <button 
                                    onClick={() => handleNotificationClick(notification.id)}
                                    className="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150 w-full text-left"
                                >
                                    <span>
                                        <i className={`pi ${getNotificationIcon(notification.type)} text-xl text-primary`}></i>
                                    </span>
                                    <div className="ml-3 flex-1">
                                        <span className="mb-2 font-semibold block text-left">
                                            {notification.title}
                                        </span>
                                        <p className="text-color-secondary m-0 text-left">
                                            {formatRelativeTime(notification.createdAt)}
                                        </p>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center p-3 text-color-secondary">
                        <i className="pi pi-bell text-2xl mb-2"></i>
                        <p className="m-0">{t('profile.noNewNotifications')}</p>
                    </div>
                )}
            </div>
        </Sidebar>
    );
};

export default AppProfileSidebar;
