"use client";
import { LayoutProvider } from "../layout/context/layoutcontext";
import { Providers } from "./providers";
import ClientOnly from "@/components/ClientOnly";

import "primeflex/primeflex.css";
import "primeicons/primeicons.css";
import { PrimeReactProvider } from "primereact/api";
import "primereact/resources/primereact.css";
import "../styles/layout/layout.scss";
import "../styles/globals.scss";
import "./globals.css";

interface RootLayoutProps {
    children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <title>Aseedak - Word Elimination Game</title>
                <meta name="description" content="Multiplayer word-based elimination game where players guess words to eliminate targets" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" type="image/x-icon" />
                <link
                    id="theme-link"
                    href={`/theme/theme-light/indigo/theme.css`}
                    rel="stylesheet"
                ></link>
            </head>
            <body>
                <Providers>
                    <PrimeReactProvider>
                        <ClientOnly>
                            <LayoutProvider>{children}</LayoutProvider>
                        </ClientOnly>
                    </PrimeReactProvider>
                </Providers>
            </body>
        </html>
    );
}
