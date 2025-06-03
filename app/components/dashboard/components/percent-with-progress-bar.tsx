export default function PercentWithProgressBar({ value }: { value: number }) {
  return (
    <div className="flex flex-col gap-y-0.5">
      <span>{(value * 100).toFixed(2)}%</span>
      <div className="h-2 bg-status-non-compliant w-full rounded-sm relative">
        <div
          className="absolute top-0 left-0 h-full bg-status-compliant rounded-sm"
          style={{
            width: `${value * 100}%`,
          }}
        ></div>
      </div>
    </div>
  );
}
