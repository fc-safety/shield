import { useImmer } from "use-immer";

export default function useDeleteAction() {
  return useImmer({
    open: false,
    action: () => {},
    cancel: () => {},
    title: "Are you sure?",
    message: "",
    requiredUserInput: "",
  });
}
