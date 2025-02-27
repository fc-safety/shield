import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Inspection } from "~/lib/models";
import DataList from "../data-list";
import DisplayInspectionValue from "./display-inspection-value";

interface InspectionDetailsProps {
  inspection: Inspection;
  googleMapsApiKey: string;
}

const INSPECTION_MAP_ID = "4d24be058a60f481";

const SHIELD_SVG_STRING = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`;

export default function InspectionDetails({
  inspection,
  googleMapsApiKey,
}: InspectionDetailsProps) {
  const { isLoaded } = useJsApiLoader({
    id: "inspection-map",
    googleMapsApiKey,
    libraries: ["maps", "marker"],
  });

  const [map, setMap] = useState<google.maps.Map>();

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  useEffect(() => {
    if (
      map &&
      inspection.latitude !== undefined &&
      inspection.longitude !== undefined
    ) {
      const parser = new DOMParser();
      const shieldSvg = parser.parseFromString(
        SHIELD_SVG_STRING,
        "image/svg+xml"
      ).documentElement;

      const pin = new google.maps.marker.PinElement({
        glyph: shieldSvg,
        scale: 1.5,
        glyphColor: "#ffffff",
        background: "#16a34a",
        borderColor: "#16a34a",
      });

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: {
          lat: inspection.latitude,
          lng: inspection.longitude,
        },
        content: pin.element,
      });

      return () => {
        marker.position = null;
      };
    }
  }, [map, inspection.latitude, inspection.longitude]);

  const locationAccuracy = useMemo(
    () => inspection.locationAccuracy ?? 150,
    [inspection.locationAccuracy]
  );

  useEffect(() => {
    if (
      map &&
      inspection.latitude !== undefined &&
      inspection.longitude !== undefined
    ) {
      const circle = new google.maps.Circle({
        map,
        center: {
          lat: inspection.latitude,
          lng: inspection.longitude,
        },
        radius: locationAccuracy,
        strokeColor: "#16a34a", // Border color
        strokeOpacity: 0.8, // Border opacity
        strokeWeight: 2, // Border thickness
        fillColor: "#16a34a", // Fill color
        fillOpacity: 0.25, // Fill opacity
      });
      return () => {
        circle.setMap(null);
      };
    }
  }, [map, inspection.latitude, inspection.longitude, locationAccuracy]);

  return (
    <div className="grid gap-6">
      <DataList
        details={[
          { label: "Date", value: format(inspection.createdOn, "PPpp") },
          {
            label: "Inspector",
            value: `${inspection.inspector?.firstName} ${inspection.inspector?.lastName}`,
          },
          { label: "Comments", value: inspection.comments },
        ]}
        defaultValue={<>&mdash;</>}
      />
      <DataList
        title="Questions"
        details={
          inspection.responses?.map((response) => ({
            label: response.assetQuestion?.prompt ?? (
              <span className="italic">Unknown</span>
            ),
            value: <DisplayInspectionValue value={response.value} />,
          })) ?? []
        }
        defaultValue={<>&mdash;</>}
      />
      <DataList
        title="Context"
        details={[
          { label: "User Agent", value: inspection.useragent },
          { label: "IPv4 Address", value: inspection.ipv4 },
          { label: "IPv6 Address", value: inspection.ipv6 },
          {
            label: "Location",
            value: `${inspection.latitude}, ${inspection.longitude}`,
          },
          {
            label: "Location Accuracy",
            value: inspection.locationAccuracy ? (
              `${Math.round(inspection.locationAccuracy)} meters`
            ) : (
              <>&mdash;</>
            ),
          },
        ]}
        defaultValue={<>&mdash;</>}
      />

      {isLoaded ? (
        <GoogleMap
          options={{
            mapId: INSPECTION_MAP_ID,
          }}
          mapContainerClassName="w-full h-96 rounded-md"
          center={{
            lat: inspection.latitude ?? 0,
            lng: inspection.longitude ?? 0,
          }}
          zoom={calculateZoomForRadius(locationAccuracy)}
          onLoad={onMapLoad}
          onUnmount={() => setMap(undefined)}
        />
      ) : (
        <Loader2 className="animate-spin" />
      )}
    </div>
  );
}

function calculateZoomForRadius(radiusInMeters: number) {
  const EARTH_CIRCUMFERENCE = 40075017; // Earth's circumference in meters
  const TILE_SIZE = 256; // Tile size in pixels (standard Google Maps tile size)
  const MAX_ZOOM = 21; // Maximum zoom level in Google Maps
  const MAGIC_NUMBER = 450; // This is the factor that makes the Zoom calculations look good

  // Calculate the zoom level
  const zoom = Math.floor(
    Math.log2(
      (EARTH_CIRCUMFERENCE / radiusInMeters) * (TILE_SIZE / MAGIC_NUMBER)
    )
  );

  // Ensure the zoom level is within the valid range
  return Math.max(0, Math.min(zoom, MAX_ZOOM));
}
