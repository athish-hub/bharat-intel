import { loadArticle } from "@/lib/articles";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) return Response.json({ exists: false });
  const article = loadArticle(slug);
  return Response.json({ exists: !!article });
}
