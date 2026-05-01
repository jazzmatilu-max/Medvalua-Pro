import { HelpCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HelpTipProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Botón de ayuda "?" que despliega un panel con guía contextual.
 * Pensado para colocarse junto al título de cada sección/módulo.
 */
export default function HelpTip({ title, children, className }: HelpTipProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Ayuda: ${title}`}
          className={cn(
            "h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary-soft",
            className,
          )}
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm leading-relaxed" align="end">
        <p className="font-semibold text-foreground mb-2">{title}</p>
        <div className="text-muted-foreground space-y-2">{children}</div>
      </PopoverContent>
    </Popover>
  );
}
