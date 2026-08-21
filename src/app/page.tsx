import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <span className="text-lg font-semibold tracking-tight">HackScout</span>
          <Badge variant="secondary">Foundation scaffold</Badge>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-16">
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight">
            Har event, har shehar
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Pakistan ka event hub. City browser, scrapers, and auth land in the
            next steps. This page confirms Next.js, Tailwind, and shadcn/ui are
            wired.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>App</CardTitle>
              <CardDescription>Next.js 16.3 App Router + Turbopack</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              TypeScript, Tailwind CSS v4, shadcn/ui
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Data</CardTitle>
              <CardDescription>Prisma + PostgreSQL (Supabase)</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Schema models are the next review step
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Auth</CardTitle>
              <CardDescription>Supabase clients stubbed</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Google + email login comes after the feed
            </CardContent>
          </Card>
        </div>

        <div>
          <Button render={<a href="/cities" />}>Cities (placeholder)</Button>
        </div>
      </main>
    </div>
  );
}
