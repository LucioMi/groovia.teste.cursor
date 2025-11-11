import type React from "react"

export default function Workflow(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
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
      <rect x="8" y="8" width="8" height="8" rx="2" />
      <path d="M4 8V4h4" />
      <path d="M4 16v4h4" />
      <path d="M16 4h4v4" />
      <path d="M16 20h4v-4" />
    </svg>
  )
}
