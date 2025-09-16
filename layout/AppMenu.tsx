import type { MenuModel } from "@/types/index";
import AppSubMenu from "./AppSubMenu";
import { useTranslation } from "@/hooks/useTranslation";

const AppMenu = () => {
    const { t } = useTranslation();
    
    const model: MenuModel[] = [
        {
            label: t('navigation.dashboard'),
            icon: "pi pi-home",
            items: [
                {
                    label: t('navigation.dashboardOverview'),
                    icon: "pi pi-fw pi-home",
                    to: "/admin",
                },
            ],
        },
        {
            label: t('navigation.gameManagement'),
            icon: "pi pi-gamepad",
            items: [
                {
                    label: t('navigation.allGames'),
                    icon: "pi pi-fw pi-list",
                    to: "/admin/games",
                },
                {
                    label: t('navigation.gameRooms'),
                    icon: "pi pi-fw pi-users",
                    to: "/admin/game-rooms",
                },
            ],
        },
        {
            label: t('navigation.userManagement'),
            icon: "pi pi-users",
            items: [
                {
                    label: t('navigation.allUsers'),
                    icon: "pi pi-fw pi-users",
                    to: "/admin/users",
                },
                {
                    label: t('navigation.userStatistics'),
                    icon: "pi pi-fw pi-chart-bar",
                    to: "/admin/users/statistics",
                },
            ],
        },
        // {
        //     label: "Store Management",
        //     icon: "pi pi-shopping-cart",
        //     items: [
        //         {
        //             label: "Words & Packs",
        //             icon: "pi pi-fw pi-list",
        //             to: "/admin/store",
        //         },
        //     ],
        // },
    ];

    return <AppSubMenu model={model} />;
};

export default AppMenu;
