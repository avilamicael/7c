import { cn } from "@/lib/utils";

const COLORS = [
  ["bg-rose-100 text-rose-700",    "dark:bg-rose-950/60 dark:text-rose-300"],
  ["bg-orange-100 text-orange-700", "dark:bg-orange-950/60 dark:text-orange-300"],
  ["bg-amber-100 text-amber-700",  "dark:bg-amber-950/60 dark:text-amber-300"],
  ["bg-lime-100 text-lime-700",    "dark:bg-lime-950/60 dark:text-lime-300"],
  ["bg-emerald-100 text-emerald-700", "dark:bg-emerald-950/60 dark:text-emerald-300"],
  ["bg-teal-100 text-teal-700",    "dark:bg-teal-950/60 dark:text-teal-300"],
  ["bg-sky-100 text-sky-700",      "dark:bg-sky-950/60 dark:text-sky-300"],
  ["bg-blue-100 text-blue-700",    "dark:bg-blue-950/60 dark:text-blue-300"],
  ["bg-violet-100 text-violet-700","dark:bg-violet-950/60 dark:text-violet-300"],
  ["bg-pink-100 text-pink-700",    "dark:bg-pink-950/60 dark:text-pink-300"],
];

function hashName(nome) {
  let h = 0;
  for (let i = 0; i < (nome?.length ?? 0); i++) {
    h = (h * 31 + nome.charCodeAt(i)) >>> 0;
  }
  return h % COLORS.length;
}

export function UserAvatar({ nome, className }) {
  const [light, dark] = COLORS[hashName(nome)];
  const inicial = nome ? nome.charAt(0).toUpperCase() : "?";

  return (
    <div
      title={nome}
      className={cn(
        "size-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0",
        light, dark,
        className
      )}
    >
      {inicial}
    </div>
  );
}
