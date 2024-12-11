import { Outlet } from "react-router";

export const handle = {
  breadcrumb: () => ({ label: "Assets" }),
};

export default function Assets() {
  return <Outlet />;
}
