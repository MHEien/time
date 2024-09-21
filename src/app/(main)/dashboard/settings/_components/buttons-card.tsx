import { cn } from "@/lib/utils"

export const ButtonsCard = ({
  className,
  onClick,
  buttonText,
  type = "button",
  variant = "primary",
}: {
  className?: string
  onClick?: () => void
  buttonText: string
  type?: "button" | "submit" | "reset"
  variant?: "primary" | "secondary"
}) => {
  return (
    <button
      onClick={onClick}
      type={type}
      className={cn(
        "rounded-xl p-[3px] text-sm font-semibold transition-all duration-300",
        variant === "primary"
          ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600"
          : "bg-gray-700 hover:bg-gray-600",
        className
      )}
    >
      <div className={cn(
        "rounded-lg px-4 py-2",
        variant === "primary" ? "bg-black" : "bg-gray-900"
      )}>
        {buttonText}
      </div>
    </button>
  )
}