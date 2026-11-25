"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState, type ComponentProps } from "react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

type PasswordInputProps = Omit<ComponentProps<"input">, "type">;

/**
 * A password input with an eye button that shows or hides what was typed. It starts hidden, and the
 * button's label says what pressing it will do, so screen readers announce it too.
 */
export function PasswordInput({ id, className, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = isVisible ? EyeOffIcon : EyeIcon;

  return (
    <InputGroup className={className}>
      <InputGroupInput {...props} id={id} type={isVisible ? "text" : "password"} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-sm"
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-controls={id}
          aria-pressed={isVisible}
          onClick={() => {
            setIsVisible((visible) => !visible);
          }}
        >
          <Icon aria-hidden="true" />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
