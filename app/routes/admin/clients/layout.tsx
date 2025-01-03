import { Outlet } from "react-router";

export const handle = {
  breadcrumb: () => ({
    label: "Clients",
  }),
};

export default function AdminClients() {
  return <Outlet />;
}
