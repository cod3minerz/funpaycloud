import ResetPasswordPage from "@/auth/pages/ResetPassword";

type ResetPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResetPage({ searchParams }: ResetPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : undefined;
  return <ResetPasswordPage token={token} />;
}

