import Aurora from "~/components/bits/Aurora/Aurora";

export default function Health() {
  return (
    <Aurora
      colorStops={["#22C55E", "#336699", "#86BBD8"]}
      blend={0.5}
      amplitude={2.0}
      speed={0.5}
      className="bg-background h-screen w-screen relative"
    >
      <h1 className="text-4xl font-bold bg-transparent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        Status: <span className="text-green-500">OK</span>
      </h1>
    </Aurora>
  );
}
