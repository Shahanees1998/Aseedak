import type { MenuModel } from "@/types/index";
import AppSubMenu from "./AppSubMenu";

const AppMenu = () => {
    const model: MenuModel[] = [
        {
            label: "Dashboard",
            icon: "pi pi-home",
            items: [
                {
                    label: "Dashboard Overview",
                    icon: "pi pi-fw pi-home",
                    to: "/admin",
                },
            ],
        },
        {
            label: "Game Management",
            icon: "pi pi-gamepad",
            items: [
                {
                    label: "All Games",
                    icon: "pi pi-fw pi-list",
                    to: "/admin/games",
                },
                {
                    label: "Game Rooms",
                    icon: "pi pi-fw pi-users",
                    to: "/admin/game-rooms",
                },
            ],
        },
        {
            label: "User Management",
            icon: "pi pi-users",
            items: [
                {
                    label: "All Users",
                    icon: "pi pi-fw pi-users",
                    to: "/admin/users",
                },
                {
                    label: "User Statistics",
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
