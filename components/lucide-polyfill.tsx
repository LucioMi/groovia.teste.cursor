// Exporta componentes de ícone simples que funcionam no ambiente de browser
import React from "react"

type IconProps = React.SVGProps<SVGSVGElement>

const createIcon = (displayName: string, path?: string) => {
  const Icon = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {path ? <path d={path} /> : <circle cx="12" cy="12" r="10" />}
    </svg>
  ))
  Icon.displayName = displayName
  return Icon
}

// Ícones mais usados
export const Moon = createIcon("Moon", "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z")
export const Sun = createIcon(
  "Sun",
  "M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41",
)
export const Bot = createIcon("Bot", "M12 8V4H8v4m4 0v8m0-8h4m-4 8v4h4v-4m-4 0H8m4 0v-4m0 4h4")
export const ArrowRight = createIcon("ArrowRight", "M5 12h14m-7-7l7 7-7 7")
export const Clock = createIcon("Clock", "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 5v5l3 3")
export const FileText = createIcon("FileText", "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z")
export const Users = createIcon("Users", "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m14-8a4 4 0 1 0 0-8 4 4 0 0 0 0 8z")
export const Activity = createIcon("Activity", "M22 12h-4l-3 9L9 3l-3 9H2")
export const Search = createIcon("Search", "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2l-4.35-4.35")
export const Send = createIcon("Send", "M22 2L11 13m11-11L15 22l-4-9-9-4 20-9z")
export const Paperclip = createIcon(
  "Paperclip",
  "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48",
)
export const Mic = createIcon("Mic", "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z")
export const Loader2 = createIcon("Loader2", "M21 12a9 9 0 1 1-6.219-8.56")
export const Download = createIcon("Download", "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5l5 5 5-5m-5 5V3")
export const Plus = createIcon("Plus", "M12 5v14m-7-7h14")
export const Pencil = createIcon("Pencil", "M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z")
export const Trash2 = createIcon(
  "Trash2",
  "M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
)
export const Sparkles = createIcon(
  "Sparkles",
  "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707",
)
export const ArrowLeft = createIcon("ArrowLeft", "M19 12H5m7 7l-7-7 7-7")
export const Play = createIcon("Play", "M5 3l14 9-14 9V3z")
export const Settings = createIcon("Settings", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z")
export const Zap = createIcon("Zap", "M13 2L3 14h9l-1 8 10-12h-9l1-8z")
export const TestTube = createIcon("TestTube", "M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5V2")
export const CheckCircle2 = createIcon(
  "CheckCircle2",
  "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm-2-7l7-7",
)
export const XCircle = createIcon(
  "XCircle",
  "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm3-13l-6 6m0-6l6 6",
)
export const AlertCircle = createIcon(
  "AlertCircle",
  "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-7v-5m0 9v.01",
)
export const RefreshCw = createIcon(
  "RefreshCw",
  "M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6m12-4a9 9 0 0 1-15 6.7L3 16",
)
export const LogOut = createIcon("LogOut", "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14l5-5-5-5m5 5H9")
export const Shield = createIcon("Shield", "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z")
export const Lock = createIcon(
  "Lock",
  "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
)
export const User = createIcon("User", "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z")
export const ExternalLink = createIcon(
  "ExternalLink",
  "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m4-3h6v6m-11 5L21 3",
)
export const X = createIcon("X", "M18 6L6 18M6 6l12 12")
export const Rocket = createIcon(
  "Rocket",
  "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z",
)
export const Database = createIcon(
  "Database",
  "M12 2C6.5 2 2 3.79 2 6v12c0 2.21 4.5 4 10 4s10-1.79 10-4V6c0-2.21-4.5-4-10-4z",
)
export const UserPlus = createIcon(
  "UserPlus",
  "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m11-11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 4h-6m3-3v6",
)
export const BarChart3 = createIcon("BarChart3", "M3 3v18h18M7 16V9m4 7V6m4 10v-4m4 4V8")
export const TrendingUp = createIcon("TrendingUp", "M22 7L13.5 15.5 8.5 10.5 2 17m20-10v6h-6")
export const MessageSquare = createIcon(
  "MessageSquare",
  "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z",
)
export const Scale = createIcon("Scale", "M12 3v18m-9-9l9-9 9 9")
export const BookOpen = createIcon(
  "BookOpen",
  "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2V3zm20 0h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7V3z",
)
export const FileCode = createIcon("FileCode", "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z")
export const ChevronDownIcon = createIcon("ChevronDown", "M6 9l6 6 6-6")
export const ChevronRightIcon = createIcon("ChevronRight", "M9 18l6-6-6-6")
export const ChevronUpIcon = createIcon("ChevronUp", "M18 15l-6-6-6 6")
export const ChevronLeftIcon = createIcon("ChevronLeft", "M15 18l-6-6 6-6")
export const CheckIcon = createIcon("Check", "M20 6L9 17l-5-5")
export const CircleIcon = createIcon(
  "Circle",
  "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
)
export const XIcon = createIcon("X", "M18 6L6 18M6 6l12 12")
export const SearchIcon = createIcon("Search", "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2l-4.35-4.35")
export const MinusIcon = createIcon("Minus", "M5 12h14")
export const GripVerticalIcon = createIcon("GripVertical", "M9 3v18m6-18v18")
export const PanelLeftIcon = createIcon("PanelLeft", "M3 3h18v18H3V3zm6 0v18")
export const Loader2Icon = Loader2
