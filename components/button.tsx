import type { ComponentProps } from "react";

/** Also styles the header's icon links, so they match the theme button. */
export const ICON_BUTTON_CLASS_NAME =
  "size-9 rounded-full text-muted hover:bg-subtle hover:text-foreground";

const VARIANT_CLASS_NAMES = {
  primary:
    "h-10 rounded-full px-4 bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc]",
  secondary:
    "h-10 rounded-full px-4 border hover:border-transparent hover:bg-subtle",
  text: "py-1 text-muted hover:text-foreground",
  icon: ICON_BUTTON_CLASS_NAME,
};

interface ButtonProps extends Omit<ComponentProps<"button">, "className"> {
  variant?: keyof typeof VARIANT_CLASS_NAMES;
}

export function Button({
  variant = "secondary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center justify-center gap-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 ${VARIANT_CLASS_NAMES[variant]}`}
      {...props}
    />
  );
}
