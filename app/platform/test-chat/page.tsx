import { redirect } from "next/navigation";

export default function Page() {
  redirect("/platform/ai-assistant?tab=test-chat");
}
