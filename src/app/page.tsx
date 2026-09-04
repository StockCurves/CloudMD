import { auth } from "@/lib/auth";
import { ReaderProvider } from "@/lib/context/ReaderContext";
import { MainAppView } from "@/components/MainAppView";

export default async function Home() {
  const session = await auth();

  return (
    <ReaderProvider sessionAccessToken={session?.accessToken}>
      <MainAppView user={session?.user} />
    </ReaderProvider>
  );
}
