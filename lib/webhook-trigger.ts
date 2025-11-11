export async function triggerWebhook(agentId: string, eventType: string, payload: any) {
  try {
    const response = await fetch("/api/webhooks/trigger", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: agentId,
        event_type: eventType,
        payload,
      }),
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error("[v0] Error triggering webhook:", error)
    throw error
  }
}
