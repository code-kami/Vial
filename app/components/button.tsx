import { forwardRef, ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "outline" | "solid";
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = "solid", className = "", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-full transition-all duration-200";
    const variants: Record<string, string> = {
      solid: "bg-lime-400 text-black hover:bg-lime-300",
      outline:
        "border border-neutral-700 text-neutral-200 hover:border-lime-400 hover:text-lime-300",
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
