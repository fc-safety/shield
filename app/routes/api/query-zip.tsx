import { z } from "zod";
import { ZIPCODESTACK_API_KEY } from "~/.server/config";
import type { Route } from "./+types/query-zip";

//    "postal_code": "84651",
// "country_code": "US",
// "latitude": 40.0449,
// "longitude": -111.7321,
// "city": "Payson",
// "state": "Utah",
// "city_en": "Payson",
// "state_en": "Utah",
// "state_code": "UT"

const resultSchema = z.object({
  postal_code: z.string(),
  country_code: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  city: z.string(),
  state: z.string(),
  city_en: z.string(),
  state_en: z.string(),
  state_code: z.nullable(z.string()),
});
const responseSchema = z.object({
  results: z.union([
    z.array(resultSchema),
    z.record(z.string(), z.array(resultSchema)),
  ]),
});

export async function loader({ params }: Route.LoaderArgs) {
  const { zip } = params;

  if (!zip) {
    throw new Response("Zip is required", { status: 400 });
  }

  const url = `https://api.zipcodestack.com/v1/search?codes=${zip}&country=us`;
  const headers = new Headers({
    apikey: ZIPCODESTACK_API_KEY,
  });
  const response = await fetch(url, { headers });

  if (!response.ok) {
    console.error("Failed to get zip code data.", await response.text());
    throw new Response("Failed to get zip code data.", { status: 500 });
  }

  let data: z.infer<typeof responseSchema>;
  try {
    const rawData = await response.json();
    data = responseSchema.parse(rawData);
  } catch (error) {
    console.error("Failed to parse zip code data.", error);
    throw new Response("Failed to parse zip code data.", { status: 500 });
  }

  const results = Array.isArray(data.results)
    ? data.results
    : data.results[zip];
  const result = results.at(0);

  if (!result) {
    throw new Response("No zip code data found.", { status: 404 });
  }

  return Response.json(result);
}
