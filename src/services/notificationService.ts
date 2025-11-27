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
      !bg-red-950/90 !backdrop-blur-md 
      !border !border-red-500/30 
      !text-red-50 !font-medium !shadow-xl !shadow-red-900/20
      !rounded-xl
    `,
    // Add a custom icon or style overrides if needed
    duration: 5000,
    style: {
      // Ensure specific overrides if Tailwind classes fight with Sonner defaults
      background: "linear-gradient(to bottom right, rgba(69, 10, 10, 0.95), rgba(127, 29, 29, 0.9))",
      border: "1px solid rgba(248, 113, 113, 0.2)",
      color: "#fef2f2",
    },
  });
}
