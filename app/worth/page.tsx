import { manifesto } from "@/content/manifesto";
import { PageShell } from "@/components/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: manifesto.title,
};

export default function WorthPage() {
  return (
    <PageShell width="essay">
      <article className="flex flex-col gap-16 py-16">
        <div className="flex flex-col gap-10">
          <h1 className="type-display">{manifesto.title}</h1>
          <p className="type-essay">{manifesto.lede}</p>
        </div>
        {manifesto.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-8">
            <h2 className="type-display lowercase">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="type-essay">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>
    </PageShell>
  );
}
