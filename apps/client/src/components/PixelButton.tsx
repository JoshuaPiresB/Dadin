import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { playSound } from "../services/audio";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold" | "wine" | "ghost" | "danger";
}

export function PixelButton({ children, variant = "gold", className = "", onClick, ...props }: PropsWithChildren<Props>) {
  return (
    <button
      className={`pixel-button pixel-button--${variant} ${className}`}
      onClick={(event) => {
        playSound("click");
        onClick?.(event);
      }}
      {...props}
    >
      <span>{children}</span>
    </button>
  );
}

