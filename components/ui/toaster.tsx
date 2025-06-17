"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"

export function Toaster() {
  const { toasts } = useToast()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (toasts.length > 0) {
      setIsVisible(true)
      const timer = setTimeout(() => setIsVisible(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [toasts.map((t) => t.id).join(",")]) // prevents duplicate re-show

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}

      <ToastViewport
        className={`fixed z-50 transition-opacity duration-300 ease-in-out
          ${isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none -z-10"}
          sm:bottom-4 sm:right-4 sm:left-auto sm:top-auto
          bottom-auto top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-sm
          sm:translate-x-0 sm:w-full`}
      />
    </ToastProvider>
  )
}
