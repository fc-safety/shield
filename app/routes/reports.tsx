import { Outlet } from "react-router";

export const handle = {
  breadcrumb: () => ({ label: "Reports" }),
};

export default function Reports() {
  return <Outlet />;
}
