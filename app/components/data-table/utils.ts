export const formatColumnId = (id: string) =>
  id
    .replace("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/(^|\s)+[a-z]/g, (m) => m.toUpperCase());
