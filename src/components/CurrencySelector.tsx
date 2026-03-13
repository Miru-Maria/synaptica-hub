import { useCurrency, Currency } from "@/context/currency";

const options: { value: Currency; label: string }[] = [
  { value: "USD", label: "$ USD" },
  { value: "EUR", label: "€ EUR" },
  { value: "RON", label: "RON" },
];

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-white/10 bg-white/[0.03]">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setCurrency(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currency === opt.value
              ? "bg-primary text-background"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
