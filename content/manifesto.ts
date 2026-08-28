export const manifesto = {
  title: "What is truly worth sharing?",
  lede: "This is a social scrapbook, not a stage.",
  sections: [
    {
      heading: "Small on purpose",
      paragraphs: [
        "We do not show you people you do not know. We do not rank what you see. We do not scroll forever. We do not make it easy to perform for strangers.",
        "If that sounds small, it is. Small is the point. Do things that do not scale.",
      ],
    },
    {
      heading: "You have to be there",
      paragraphs: [
        "There is no search. There is no directory. There is no one the software thinks you might like.",
        "You open this on your phone and show a code. Someone standing with you scans it. If they have never been here, that is how they arrive.",
        "The code lives for a minute and dies when it is used. A screenshot is not a meeting. Meeting is the product.",
        "Until you scan someone, there is nothing to view. An empty scrapbook is not a bug. You have not met anyone yet.",
      ],
    },
    {
      heading: "After you meet",
      paragraphs: [
        "People you have stood with see what you mark public. That is the scrapbook you keep with everyone you have met here.",
        "A group is a named channel of selected friends. Anyone in it can place something. Only members see it. You do not inherit someone else's intimacies.",
      ],
    },
    {
      heading: "Each thing chooses",
      paragraphs: [
        "Not an account that is open or closed. Each scrap you place is a choice: public, for the people you have stood with, or a group you named together.",
        "Signed out, there is still nothing. What we call public is not the street. It is the people you have met.",
      ],
    },
    {
      heading: "Friction",
      paragraphs: [
        "Good social software creates friction.",
        "Capture in the moment. Sit with it later. Do not feed it in line. Do not discover a stranger because something was hungry for your time.",
        "There is a last thing for today. When you have seen it, you are done.",
      ],
    },
    {
      heading: "Words",
      paragraphs: [
        "We do not like. We do not follow. We do not post. We do not story. We do not discover.",
        "The verbs we will keep are heavier: love, inspired, curate. They mean what they say.",
      ],
    },
    {
      heading: "Before it leaves your phone",
      paragraphs: ["What is truly worth sharing?"],
    },
  ],
} as const;

export const walkthrough = [
  {
    title: "How it works",
    body: "There is no search and no feed of strangers. You meet in person. One of you shows a code; the other scans it. Until that happens, the scrapbook is empty on purpose.",
  },
  {
    title: "What sharing is",
    body: "Public is for everyone you have stood with. A group is a named channel of selected friends — anyone in it can place something, and only they see it.",
  },
  {
    title: "Why it is secure",
    body: "The code lasts about a minute and can be used once. We store a hash, not the code. Photographs never have a public URL. Signed out, there is nothing to see.",
  },
] as const;
