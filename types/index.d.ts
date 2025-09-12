import { ReactNode } from "react";
import {
    AppBreadcrumbProps,
    Breadcrumb,
    BreadcrumbItem,
    ColorScheme,
    MenuProps,
    MenuModel,
    LayoutConfig,
    LayoutState,
    LayoutContextProps,
    MenuContextProps,
    AppConfigProps,
    NodeRef,
    AppTopbarRef,
    AppMenuItemProps,
    UseSubmenuOverlayPositionProps,
    ChildContainerProps,
    Page,
} from "./layout";

type ChildContainerProps = {
    children: ReactNode;
};

export type {
    Page,
    AppBreadcrumbProps,
    Breadcrumb,
    BreadcrumbItem,
    ColorScheme,
    MenuProps,
    MenuModel,
    LayoutConfig,
    LayoutState,
    LayoutContextProps,
    MenuContextProps,
    AppConfigProps,
    NodeRef,
    AppTopbarRef,
    AppMenuItemProps,
    UseSubmenuOverlayPositionProps,
    ChildContainerProps,
};
