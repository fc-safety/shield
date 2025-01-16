const FONT_AWESOME_VERSION = "6.7.2";

export const searchIcons = async (query: string) => {
  return fetch(`https://api.fontawesome.com/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `query { search (version: "${FONT_AWESOME_VERSION}", query: "${query}") { id, label }}`,
    }),
  })
    .then(
      (response) =>
        response.json() as Promise<{
          data: { search: { id: string; label: string }[] };
        }>
    )
    .then((data) => data.data.search);
};
