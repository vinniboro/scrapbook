export type BookHit = {
  googleVolumeId: string;
  bookTitle: string;
  bookAuthors: string | null;
  bookThumbnailUrl: string | null;
};

type GoogleBooksResponse = {
  items?: Array<{
    id: string;
    volumeInfo?: {
      title?: string;
      authors?: string[];
      imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    };
  }>;
};

export async function searchBooks(query: string): Promise<BookHit[]> {
  const q = query.trim().slice(0, 120);
  if (!q) return [];
  const params = new URLSearchParams({
    q,
    maxResults: "8",
    printType: "books",
  });
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  if (key) params.set("key", key);
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?${params.toString()}`,
    { cache: "no-store" },
  );
  if (!response.ok) return [];
  const json = (await response.json()) as GoogleBooksResponse;
  return (json.items ?? [])
    .filter((item) => item.id && item.volumeInfo?.title)
    .map((item) => {
      const thumb =
        item.volumeInfo?.imageLinks?.thumbnail ||
        item.volumeInfo?.imageLinks?.smallThumbnail ||
        null;
      return {
        googleVolumeId: item.id,
        bookTitle: item.volumeInfo!.title!,
        bookAuthors: item.volumeInfo?.authors?.join(", ") ?? null,
        bookThumbnailUrl: thumb ? thumb.replace("http://", "https://") : null,
      };
    });
}
