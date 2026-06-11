/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { cn } from "./utils";

const buttonVariants = (variant = "default") => {
  const selectedVariant =
    typeof variant === "object" && variant !== null ? variant.variant : variant;

  const variants = {
    default: "bg-black text-white  hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input border-gray-300  bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  };
  return variants[selectedVariant] || variants.default;
};

const buttonSizes = (size = "default") => {
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  };
  return sizes[size] || sizes.default;
};

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  return (
    <button
      className={cn(
        "inline-flex min-w-0 items-center justify-center rounded-md text-center text-sm font-medium leading-tight ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        buttonVariants(variant),
        buttonSizes(size),
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
