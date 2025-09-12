"use client";

import Layout from "@/layout/layout";

export default function TestLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
