import type { Metadata } from "next";
import { ChatShell } from "@/components/chat/chat-shell";

export const metadata: Metadata = {
  title: "Chat · ComplexityLab",
};

export default function ChatPage() {
  return <ChatShell />;
}
