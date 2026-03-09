"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "xl";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

var variantMap: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  outline: "btn-outline",
  danger: "btn-danger"
};

var sizeMap: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
  xl: "btn-xl"
};

export var Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  var variant = props.variant || "primary";
  var size = props.size || "md";
  var loading = props.loading || false;
  var fullWidth = props.fullWidth || false;
  var leftIcon = props.leftIcon;
  var rightIcon = props.rightIcon;
  var children = props.children;
  var className = props.className;
  var disabled = props.disabled;
  var type = props.type || "button";

  var rest: Record<string, unknown> = {};
  Object.keys(props).forEach(function(key) {
    if (!["variant","size","loading","fullWidth","leftIcon","rightIcon","children","className","disabled","type"].includes(key)) {
      rest[key] = (props as Record<string, unknown>)[key];
    }
  });

  return React.createElement(
    "button",
    Object.assign({}, rest, {
      ref: ref,
      type: type,
      disabled: disabled || loading,
      className: cn("btn", variantMap[variant], sizeMap[size], fullWidth ? "w-full" : "", className || "")
    }),
    loading && React.createElement(Loader2, { size: 15, className: "animate-spin shrink-0" }),
    !loading && leftIcon && React.createElement("span", { className: "shrink-0" }, leftIcon),
    children,
    !loading && rightIcon && React.createElement("span", { className: "shrink-0" }, rightIcon)
  );
});

Button.displayName = "Button";
