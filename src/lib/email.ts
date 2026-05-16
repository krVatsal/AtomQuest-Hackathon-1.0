import { Resend } from "resend";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
} from "@react-email/components";
import * as React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "AtomQuest <noreply@example.com>";

interface EmailUser {
  email: string;
  name: string;
}

// ─── React Email Templates ──────────────────────────────────

function ApprovedEmail({ name }: { name: string }) {
  return React.createElement(
    Html,
    null,
    React.createElement(Head),
    React.createElement(
      Body,
      { style: { fontFamily: "system-ui, sans-serif", backgroundColor: "#f9fafb" } },
      React.createElement(
        Container,
        { style: { maxWidth: "480px", margin: "0 auto", padding: "40px 20px" } },
        React.createElement(
          Section,
          { style: { backgroundColor: "#ffffff", borderRadius: "8px", padding: "32px", border: "1px solid #e5e7eb" } },
          React.createElement(Heading, { as: "h2", style: { margin: "0 0 16px", fontSize: "20px", color: "#111827" } }, "Goal Sheet Approved"),
          React.createElement(Text, { style: { color: "#374151", lineHeight: "1.6", margin: "0 0 16px" } }, `Hi ${name},`),
          React.createElement(Text, { style: { color: "#374151", lineHeight: "1.6", margin: "0 0 16px" } }, "Your goal sheet has been approved and locked by your manager. You can now begin tracking your achievements for this cycle."),
          React.createElement(Hr, { style: { borderColor: "#e5e7eb", margin: "24px 0" } }),
          React.createElement(Text, { style: { color: "#9ca3af", fontSize: "12px", margin: "0" } }, "AtomQuest Goal Management System")
        )
      )
    )
  );
}

function ReturnedEmail({ name, reason }: { name: string; reason: string }) {
  return React.createElement(
    Html,
    null,
    React.createElement(Head),
    React.createElement(
      Body,
      { style: { fontFamily: "system-ui, sans-serif", backgroundColor: "#f9fafb" } },
      React.createElement(
        Container,
        { style: { maxWidth: "480px", margin: "0 auto", padding: "40px 20px" } },
        React.createElement(
          Section,
          { style: { backgroundColor: "#ffffff", borderRadius: "8px", padding: "32px", border: "1px solid #e5e7eb" } },
          React.createElement(Heading, { as: "h2", style: { margin: "0 0 16px", fontSize: "20px", color: "#111827" } }, "Goal Sheet Returned for Rework"),
          React.createElement(Text, { style: { color: "#374151", lineHeight: "1.6", margin: "0 0 16px" } }, `Hi ${name},`),
          React.createElement(Text, { style: { color: "#374151", lineHeight: "1.6", margin: "0 0 16px" } }, "Your manager has returned your goal sheet for rework. Please review the feedback below and update your goals."),
          React.createElement(
            Section,
            { style: { backgroundColor: "#fef2f2", borderRadius: "6px", padding: "16px", border: "1px solid #fecaca", margin: "16px 0" } },
            React.createElement(Text, { style: { fontWeight: 600, color: "#991b1b", margin: "0 0 8px", fontSize: "13px" } }, "Manager\u2019s Feedback:"),
            React.createElement(Text, { style: { color: "#991b1b", margin: "0", lineHeight: "1.5" } }, reason)
          ),
          React.createElement(Hr, { style: { borderColor: "#e5e7eb", margin: "24px 0" } }),
          React.createElement(Text, { style: { color: "#9ca3af", fontSize: "12px", margin: "0" } }, "AtomQuest Goal Management System")
        )
      )
    )
  );
}

// ─── Send Functions ─────────────────────────────────────────

export async function sendGoalApproved(employee: EmailUser) {
  try {
    await resend.emails.send({
      from: FROM,
      to: employee.email,
      subject: "Your Goal Sheet Has Been Approved",
      react: React.createElement(ApprovedEmail, { name: employee.name }),
    });
  } catch (error) {
    console.error("[email] Failed to send approval email:", error);
  }
}

export async function sendGoalReturned(employee: EmailUser, reason: string) {
  try {
    await resend.emails.send({
      from: FROM,
      to: employee.email,
      subject: "Goal Sheet Returned for Rework",
      react: React.createElement(ReturnedEmail, { name: employee.name, reason }),
    });
  } catch (error) {
    console.error("[email] Failed to send return email:", error);
  }
}
