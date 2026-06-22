export interface SupportReplyEmailProps {
  ticketId: string;
  subject: string;
  replyPreview: string;
  ticketUrl: string;
}

export function SupportReplyEmail({
  ticketId,
  subject,
  replyPreview,
  ticketUrl,
}: SupportReplyEmailProps) {
  return (
    <html>
      <body style={{ margin: 0, backgroundColor: "#0B0B0C", color: "#FAF8F3", fontFamily: "Arial, sans-serif" }}>
        <main style={{ maxWidth: "560px", margin: "0 auto", padding: "32px 20px" }}>
          <section style={{ backgroundColor: "#1F1F22", border: "1px solid #2D2D30", borderRadius: "8px", padding: "24px" }}>
            <h1 style={{ margin: "0 0 12px", color: "#D4A943" }}>New support reply</h1>
            <p style={{ margin: "0 0 12px" }}>
              GVSwift support replied to your ticket: <strong>{subject}</strong>
            </p>
            <p style={{ margin: "0 0 12px", color: "#A0A09B" }}>
              Ticket ID: <span style={{ color: "#D4A943" }}>{ticketId}</span>
            </p>
            <blockquote style={{ margin: "0 0 20px", padding: "12px 16px", borderLeft: "3px solid #D4A943", backgroundColor: "#0B0B0C", color: "#FAF8F3" }}>
              {replyPreview}
            </blockquote>
            <a href={ticketUrl} style={{ color: "#1F1500", backgroundColor: "#D4A943", padding: "10px 16px", borderRadius: "6px", textDecoration: "none", fontWeight: 700 }}>
              View ticket
            </a>
          </section>
        </main>
      </body>
    </html>
  );
}
