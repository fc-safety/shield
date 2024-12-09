import { Outlet } from "@remix-run/react";

export const handle = {
  breadcrumb: () => ({ label: "Reports" }),
};

export default function Reports() {
  return <Outlet />;
}
