import { notFound } from "next/navigation";
import { CustomMDX } from "app/components/mdx";
import { getEventPosts } from "app/lib/fs";
import { formatDate } from "app/lib/utils";
import { baseUrl } from "app/sitemap";
import Link from "app/components/link";
import { ShareButtons } from "app/components/share-buttons";

export async function generateStaticParams() {
  let posts = getEventPosts();

  return (posts || []).map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  let post = getEventPosts()?.find((post) => post.slug === slug);
  if (!post) {
    return;
  }

  let {
    title,
    publishedAt: publishedTime,
    person: description,
    image,
  } = post.metadata;
  let ogImage = image
    ? image
    : `${baseUrl}/og?title=${encodeURIComponent(title)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime,
      url: `${baseUrl}/event/${post.slug}`,
      images: [
        {
          url: ogImage,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function Event({ params }) {
  const { slug } = await params;
  let post = getEventPosts()?.find((post) => post.slug === slug);

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
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.publishedAt,
            description: post.metadata.person,
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
        {post.metadata.title}
      </h1>
      <div className="flex justify-between items-center mt-2 mb-8 text-sm">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {formatDate(post.metadata.publishedAt)}
        </p>
      </div>
      {post.metadata.link && (
        <Link
          href={post.metadata.link}
          className="bg-gradient-to-tr from-purple-800 to-purple-600 text-white font-medium px-4 py-2 rounded-md text-sm float-right flex items-center justify-center gap-x-2 !mb-5 sm:w-auto w-full"
        >
          Join now
        </Link>
      )}
      <article className="prose">
        <CustomMDX source={post.content} />
      </article>
      <ShareButtons
        url={`${baseUrl}/event/${post.slug}`}
        title={post.metadata.title}
        description={post.metadata.person}
      />
    </section>
  );
}
