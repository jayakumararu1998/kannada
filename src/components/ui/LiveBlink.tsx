type LiveBlinkProps = {
  className?: string;
};

export default function LiveBlink({ className = "mr-2" }: LiveBlinkProps) {
  return (
    <span className={`inline-flex items-center align-middle ${className}`}>
      <span className="relative inline-flex h-4 w-4 items-center justify-center">
        <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-40 animate-[wave_1.5s_ease-out_infinite]" />
        <span className="absolute inline-flex h-3 w-3 rounded-full bg-red-500 opacity-60 animate-[wave_1.5s_ease-out_0.3s_infinite]" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
      </span>
    </span>
  );
}
