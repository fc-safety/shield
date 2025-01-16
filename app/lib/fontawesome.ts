import { FONT_AWESOME_VERSION } from "./constants";

export const searchIcons = async (query: string) => {
  return fetch(`https://api.fontawesome.com/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `query { search (version: "${FONT_AWESOME_VERSION}", query: "${query}", first: 20) { id, label, familyStylesByLicense { free { style } } }}`,
    }),
  })
    .then(
      (response) =>
        response.json() as Promise<{
          data: {
            search: {
              id: string;
              label: string;
              familyStylesByLicense: { free: { style: string }[] };
            }[];
          };
        }>
    )
    .then((data) =>
      data.data.search.filter(
        ({ familyStylesByLicense }) => familyStylesByLicense.free.length > 0
      )
    );
};
