import { Outlet } from "react-router";

export const handle = {
  breadcrumb: () => ({
    label: "Categories",
  }),
};

export default function ProductCategoriesLayout() {
  return <Outlet />;
}
