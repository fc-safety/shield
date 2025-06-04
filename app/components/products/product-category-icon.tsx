import Icon from "../icons/icon";

export default function ProductCategoryIcon({
  category,
}: {
  category: {
    icon?: string | null;
    color?: string | null;
  };
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
