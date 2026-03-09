"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
};

export var Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  var label = props.label;
  var error = props.error;
  var hint = props.hint;
  var leftIcon = props.leftIcon;
  var rightElement = props.rightElement;
  var className = props.className;
  var id = props.id;
  var required = props.required;

  var rest: Record<string, unknown> = {};
  Object.keys(props).forEach(function(key) {
    if (!["label","error","hint","leftIcon","rightElement","className"].includes(key)) {
      rest[key] = (props as Record<string, unknown>)[key];
    }
  });

  var fieldId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  var errorId = fieldId ? fieldId + "-err" : undefined;
  var hintId  = fieldId ? fieldId + "-hint" : undefined;

  return React.createElement(
    "div",
    { className: "w-full" },
    label && React.createElement(
      "label",
      { htmlFor: fieldId, className: "label" },
      label,
      required && React.createElement("span", { className: "text-red-500 ml-0.5" }, "*")
    ),
    React.createElement(
      "div",
      { className: "relative" },
      leftIcon && React.createElement(
        "span",
        { className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" },
        leftIcon
      ),
      React.createElement("input", Object.assign({}, rest, {
        ref: ref,
        id: fieldId,
        className: cn(
          "input",
          leftIcon ? "pl-10" : "",
          rightElement ? "pr-10" : "",
          error ? "input-error" : "",
          className || ""
        ),
        "aria-describedby": error ? errorId : hint ? hintId : undefined
      })),
      rightElement && React.createElement(
        "span",
        { className: "absolute right-3.5 top-1/2 -translate-y-1/2" },
        rightElement
      )
    ),
    error && React.createElement(
      "p",
      { id: errorId, role: "alert", className: "field-error" },
      React.createElement(AlertCircle, { size: 11, className: "shrink-0" }),
      error
    ),
    !error && hint && React.createElement(
      "p",
      { id: hintId, className: "field-hint" },
      hint
    )
  );
});

Input.displayName = "Input";
