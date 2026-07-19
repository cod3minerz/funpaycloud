import AIAssistantPage from "@/platform2/pages/AIAssistant";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  return <AIAssistantPage initialTab={params.tab === "test-chat" ? "test-chat" : "settings"} />;
}
