import { toast as sonner } from "sonner";
import { getErrorMessage } from "../services/api";

/** Thin wrappers so call sites stay consistent */
export const toast = {
  success: (message: string) => sonner.success(message),
  error: (message: string) => sonner.error(message),
  info: (message: string) => sonner(message),
  /** Show API / thrown errors as a toast */
  fromError: (err: unknown, fallback = "Something went wrong") => {
    const message = getErrorMessage(err) || fallback;
    sonner.error(message);
    return message;
  },
  /** Confirm-style toast with an action button (replaces window.confirm) */
  confirm: (message: string, onConfirm: () => void, confirmLabel = "Confirm") => {
    sonner(message, {
      action: {
        label: confirmLabel,
        onClick: onConfirm,
      },
      cancel: {
        label: "Cancel",
        onClick: () => undefined,
      },
    });
  },
};
