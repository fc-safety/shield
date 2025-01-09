import { Outlet } from "react-router";

export const handle = {
  breadcrumb: () => ({
    label: "Products",
  }),
};

export default function Products() {
  return <Outlet />;
}
