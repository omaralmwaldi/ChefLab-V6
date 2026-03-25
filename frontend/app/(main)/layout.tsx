import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </AuthGuard>
  );
}
