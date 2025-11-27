import { toast } from "sonner";

/**
 * Show an error toast with a modern, premium design.
 * Uses a glassmorphism effect with a rich red gradient border/background.
 * @param message The error message to display.
 */
export function showError(message: string) {
  toast.error(message, {
    position: "top-right",
    // Custom styling for a premium look
    className: `
      !bg-red-600/80 !backdrop-blur-md 
      !border !border-red-400/50 
      !text-white !font-medium !shadow-lg !shadow-red-900/20
      !rounded-xl
    `,
    // Add a custom icon or style overrides if needed
    duration: 5000,
    style: {
      // Ensure specific overrides if Tailwind classes fight with Sonner defaults
      background: "transparent", // Allow Tailwind classes to show
      border: "1px solid rgba(248, 113, 113, 0.5)",
      color: "#ffffff",
    },
  });
}
