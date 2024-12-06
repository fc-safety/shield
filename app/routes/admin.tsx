import { Outlet } from "@remix-run/react";

export const handle = {
  breadcrumb: () => ({
    label: "Admin",
  }),
};

export default function Admin() {
  return <Outlet />;
}
