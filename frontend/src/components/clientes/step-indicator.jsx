export function StepIndicator({ current, steps }) {
  return (
    <div className="w-full mb-6 px-4">
      <div className="relative flex items-start justify-between">
        
        {/* Linha de fundo (cinza) */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted-foreground/20 -translate-y-1/2 z-0" />
        
        {/* Linha de progresso (colorida) */}
        <div
          className="absolute top-4 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: `${(current / (steps.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        {steps.map((label, i) => (
          <div key={i} className="relative z-10 flex flex-col items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300 bg-background
                ${i < current ? "bg-primary border-primary text-primary-foreground" : ""}
                ${i === current ? "border-primary text-primary bg-primary/10" : ""}
                ${i > current ? "border-muted-foreground/30 text-muted-foreground bg-background" : ""}
              `}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span
              className={`text-xs whitespace-nowrap font-medium transition-all
                ${i === current ? "text-primary" : "text-muted-foreground"}
              `}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}