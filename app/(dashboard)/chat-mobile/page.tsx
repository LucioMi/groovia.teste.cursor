import { MobileChatPanel } from "@/components/mobile-chat-panel"

export default function MobileChatPage() {
  return (
    <div className="h-screen">
      <MobileChatPanel
        agentId="demo-agent"
        agentName="Assistente IA"
        onSendMessage={(message, attachments) => {
          console.log("Message sent:", message)
          console.log("Attachments:", attachments)
        }}
      />
    </div>
  )
}
