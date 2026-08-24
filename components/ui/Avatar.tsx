export function Avatar({ initial, color, size = 32 }: { initial: string; color: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  );
}
