import { manifesto } from "@/content/manifesto";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: manifesto.title,
};

export default function WorthPage() {
  return (
    <main>
      <article>
        <h1>{manifesto.title}</h1>
        <p>{manifesto.lede}</p>
        {manifesto.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </article>
    </main>
  );
}
