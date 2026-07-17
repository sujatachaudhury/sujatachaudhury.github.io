import { profile } from "@/content/profile";

/**
 * JSON-LD emitters. Inline schema markup as <script type="application/ld+json">.
 * Kept as React components so pages can drop them into their tree.
 */

export function PersonJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.fullName,
    givenName: profile.givenName,
    familyName: profile.familyName,
    email: `mailto:${profile.email}`,
    url: profile.urls.website,
    jobTitle: "ML & Computer Vision Engineer",
    address: {
      "@type": "PostalAddress",
      addressLocality: profile.location.city,
      addressCountry: profile.location.countryCode,
    },
    sameAs: [profile.urls.linkedin, profile.urls.github],
    alumniOf: [
      {
        "@type": "CollegeOrUniversity",
        name: "Politecnico di Milano",
      },
      {
        "@type": "CollegeOrUniversity",
        name: "Tampere University",
      },
      {
        "@type": "CollegeOrUniversity",
        name: "National Institute of Technology, Agartala",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function WebSiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: profile.fullName,
    url: profile.urls.website,
    inLanguage: "en",
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function ScholarlyArticleJsonLd({
  title,
  authors,
  publisher,
  date,
  doi,
  url,
}: {
  title: string;
  authors: string;
  publisher: string;
  date: string;
  doi: string;
  url: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: title,
    author: authors.split(",").map((name) => ({ "@type": "Person", name: name.trim() })),
    publisher: { "@type": "Organization", name: publisher },
    datePublished: date,
    identifier: doi,
    url,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
