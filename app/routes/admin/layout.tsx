import { Outlet } from "react-router";

export const handle = {
  breadcrumb: () => ({
    label: "Admin",
  }),
};

export default function Admin() {
  return <Outlet />;
}
