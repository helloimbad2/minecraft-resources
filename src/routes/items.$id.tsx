import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Download, ExternalLink, Check, X } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ItemSprite } from "@/components/ItemSprite";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getItemBySlug, getItemFacts, getDownloadUrl, type MinecraftItem } from "@/data/items";

export const Route = createFileRoute("/items/$id")({
  loader: ({ params }) => {
    const item = getItemBySlug(params.id);
    if (!item) throw notFound();
    return { item };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.item.displayName ?? "Item";
    return {
      meta: [
        { title: `${name} — Minecraft Item | Minecraft Resources` },
        { name: "description", content: `Facts about the Minecraft item ${name}: where it's found, stack size and more.` },
        { property: "og:title", content: `${name} — Minecraft Item` },
        { property: "og:description", content: `Where to find ${name} in Minecraft and its key facts.` },
      ],
    };
  },
  component: ItemDetail,
  errorComponent: ({ error }) => (
    <Layout>
      <div className="border-2 border-destructive/50 bg-destructive/10 p-6">{error.message}</div>
    </Layout>
  ),
  notFoundComponent: () => (
    <Layout>
      <div className="border-2 border-border bg-card p-10 text-center">
        <p className="text-muted-foreground">That item doesn't exist.</p>
        <Button asChild variant="default" className="mt-4">
          <Link to="/items">Back to items</Link>
        </Button>
      </div>
    </Layout>
  ),
});

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ItemDetail() {
  const { item } = Route.useLoaderData() as { item: MinecraftItem };
  const facts = getItemFacts(item);
  const wikiUrl = `https://minecraft.wiki/w/${item.displayName.replace(/ /g, "_")}`;

  return (
    <Layout>
      <Link
        to="/items"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to items
      </Link>

      <div className="grid gap-8 md:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <div className="aspect-square border-2 border-border bg-card p-10 pixel-shadow">
            <ItemSprite name={item.name} alt={item.displayName} size={150} className="size-full" />
          </div>
          <Button asChild variant="hero" className="w-full">
            <a href={getDownloadUrl(item.name)} download={`${item.name}.png`} target="_blank" rel="noreferrer">
              <Download className="size-4" /> Download texture
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <a href={wikiUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" /> View on Minecraft Wiki
            </a>
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <Badge variant="secondary">{item.category}</Badge>
            <h1 className="mt-2 font-display text-4xl text-primary">{item.displayName}</h1>
            <p className="mt-2 text-muted-foreground">{facts.description}</p>
          </div>

          <div className="border-2 border-border bg-card p-5 pixel-shadow-sm">
            <h2 className="font-display text-xl">Facts</h2>
            <div className="mt-2">
              <Fact label="ID" value={<code className="text-sm">minecraft:{item.name}</code>} />
              <Fact label="Category" value={item.category} />
              <Fact label="Max stack size" value={item.stackSize} />
              <Fact
                label="Stackable"
                value={facts.stackable ? <Check className="size-4 text-primary" /> : <X className="size-4 text-muted-foreground" />}
              />
              <Fact
                label="Renewable"
                value={facts.renewable ? <Check className="size-4 text-primary" /> : <X className="size-4 text-muted-foreground" />}
              />
            </div>
          </div>

          <div className="border-2 border-border bg-card p-5 pixel-shadow-sm">
            <h2 className="font-display text-xl">Where it's found</h2>
            <ul className="mt-3 space-y-2">
              {facts.foundIn.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 size-2 shrink-0 bg-primary" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
