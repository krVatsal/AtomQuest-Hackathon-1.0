export interface TeamsCardOptions {
  webhookUrl?: string;
  title: string;
  body: string;
  deepLink?: string;
  deepLinkLabel?: string;
}

export async function sendTeamsCard({
  webhookUrl,
  title,
  body,
  deepLink,
  deepLinkLabel = "View Goal Sheet",
}: TeamsCardOptions): Promise<void> {
  const url = webhookUrl ?? process.env.TEAMS_WEBHOOK_URL;
  if (!url) return;

  const card = {
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        text: title,
        weight: "Bolder",
        size: "Medium",
        wrap: true,
        color: "Default",
      },
      {
        type: "TextBlock",
        text: body,
        wrap: true,
        spacing: "Small",
      },
    ],
    ...(deepLink && {
      actions: [
        {
          type: "Action.OpenUrl",
          title: deepLinkLabel,
          url: deepLink,
        },
      ],
    }),
  };

  const payload = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: card,
      },
    ],
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`[teams] Webhook returned ${res.status}`);
    }
  } catch (error) {
    console.error("[teams] Failed to send Teams card:", error);
  }
}
