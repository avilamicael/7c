import { useState, useRef } from "react";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function DatePicker({ value, onChange, placeholder = "dd/mm/aaaa" }) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(
    value ? format(new Date(value + "T00:00:00"), "dd/MM/yyyy") : ""
  );
  const inputRef = useRef(null);

  // Aplica máscara dd/mm/aaaa enquanto digita
  const applyMask = (raw) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    let masked = digits;
    if (digits.length > 2) masked = digits.slice(0, 2) + "/" + digits.slice(2);
    if (digits.length > 4) masked = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
    return masked;
  };

  const handleInputChange = (e) => {
    const masked = applyMask(e.target.value);
    setInputValue(masked);

    // Quando data completa, converte para yyyy-MM-dd e notifica
    if (masked.length === 10) {
      const parsed = parse(masked, "dd/MM/yyyy", new Date());
      if (isValid(parsed)) {
        onChange(format(parsed, "yyyy-MM-dd"));
      }
    } else {
      onChange("");
    }
  };

  const handleCalendarSelect = (selected) => {
    if (selected) {
      const formatted = format(selected, "dd/MM/yyyy");
      setInputValue(formatted);
      onChange(format(selected, "yyyy-MM-dd"));
    }
    setOpen(false);
    inputRef.current?.focus();
  };

  const calendarDate = value ? new Date(value + "T00:00:00") : undefined;

  return (
    <div className="flex gap-1">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="flex-1"
        maxLength={10}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn("shrink-0", calendarDate && "text-primary")}
            tabIndex={-1}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={calendarDate}
            onSelect={handleCalendarSelect}
            locale={ptBR}
            captionLayout="dropdown"
            fromYear={1900}
            toYear={new Date().getFullYear() + 20}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}