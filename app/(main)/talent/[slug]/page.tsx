import { notFound } from "next/navigation";
import { CustomMDX } from "app/components/mdx";
import { getEventPosts, getTalentPosts } from "app/lib/fs";
import { baseUrl } from "app/sitemap";
import Link from "app/components/link";
import { ShareButtons } from "app/components/share-buttons";

export async function generateStaticParams() {
  let posts = getTalentPosts();

  return (posts || []).map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  let post = getTalentPosts()?.find((post) => post.slug === slug);
  if (!post) {
    return;
  }

  let { name, role, title, image } = post.metadata;
  let ogImage = image
    ? image
    : `${baseUrl}/og?title=${encodeURIComponent(name)}`;

  return {
    title: name,
    description: `${role} - ${title}`,
    openGraph: {
      title: name,
      description: `${role} - ${title}`,
      type: "article",
      url: `${baseUrl}/event/${post.slug}`,
      images: [
        {
          url: ogImage,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description: `${role} - ${title}`,
      images: [ogImage],
    },
  };
}

export default async function Event({ params }) {
  const { slug } = await params;
  let post = getTalentPosts()?.find((post) => post.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <section>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EventPosting",
            headline: post.metadata.name,
            description: `${post.metadata.role} - ${post.metadata.title}`,
            image: post.metadata.image
              ? `${baseUrl}${post.metadata.image}`
              : `/og?title=${encodeURIComponent(post.metadata.title)}`,
            url: `${baseUrl}/event/${post.slug}`,
            author: {
              "@type": "Organization",
              name: "Fydemy",
            },
          }),
        }}
      />
      <h1 className="title font-semibold text-2xl tracking-tighter">
        {post.metadata.name}
      </h1>
      <div className="flex justify-between items-center mt-2 mb-8 text-sm">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {post.metadata.title}
        </p>
      </div>
      <article className="prose">
        <CustomMDX source={post.content} />
      </article>
      <ShareButtons
        url={`${baseUrl}/talent/${post.slug}`}
        title={post.metadata.title}
        description={post.metadata.person}
      />
    </section>
  );
}
