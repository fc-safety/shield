import type { ProductCategory } from "~/lib/models";
import Icon from "../icons/icon";

export default function ProductCategoryIcon({
  category,
}: {
  category: ProductCategory;
}) {
  return (
    (category.icon || category.color) && (
      <Icon
        iconId={category.icon ?? "box"}
        color={category.color}
        className="text-sm mr-1"
      />
    )
  );
}
