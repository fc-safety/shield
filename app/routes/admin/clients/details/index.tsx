import { redirect } from "react-router";
import type { Route } from "./+types/index";

export const loader = ({}: Route.LoaderArgs) => {
  return redirect("./sites");
};

export default function ClientDetails() {
  return <div>ClientDetails</div>;
}
