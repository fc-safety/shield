import { Outlet } from "react-router";

export const handle = {
  breadcrumb: () => ({
    label: "Products",
  }),
};

export default function AdminProducts() {
  return <Outlet />;
}
