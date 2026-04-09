import VerifyCodePage from "@/auth/pages/VerifyCode";

type VerifyPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : undefined;
  const mode = typeof params.mode === "string" ? params.mode : undefined;

  return <VerifyCodePage email={email} mode={mode} />;
}
