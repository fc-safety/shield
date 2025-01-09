import { Outlet } from "react-router";

export const handle = {
  breadcrumb: () => ({
    label: "Manufacturers",
  }),
};

export default function ProductManufacturersLayout() {
  return <Outlet />;
}
