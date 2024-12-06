import { Outlet } from "@remix-run/react";

export const handle = {
  breadcrumb: () => ({ label: "Assets" }),
};

export default function Assets() {
  return <Outlet />;
}
