
import * as React from "react"
import { cn } from "@/lib/utils"

const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "absolute -m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0",
      "[clip:rect(0,0,0,0)]",
      className
    )}
    {...props}
  />
))
VisuallyHidden.displayName = "VisuallyHidden"

export { VisuallyHidden }
import * as React from "react"

interface VisuallyHiddenProps {
  children: React.ReactNode
}

const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  VisuallyHiddenProps
>(({ children, ...props }, ref) => {
  return (
    <span
      ref={ref}
      style={{
        position: 'absolute',
        border: 0,
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        wordWrap: 'normal'
      }}
      {...props}
    >
      {children}
    </span>
  )
})

VisuallyHidden.displayName = "VisuallyHidden"

export { VisuallyHidden }
