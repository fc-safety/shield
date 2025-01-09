import { Outlet } from "react-router";

export const handle = {
  breadcrumb: () => ({
    label: "Tags",
  }),
};

export default function AdminTagsLayout() {
  return <Outlet />;
}
