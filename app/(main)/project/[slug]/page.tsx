import { notFound } from "next/navigation";
import { CustomMDX } from "app/components/mdx";
import { getProjectPosts } from "app/lib/fs";
import { baseUrl } from "app/sitemap";
import Image from "next/image";
import Link from "next/link";
import { ShareButtons } from "app/components/share-buttons";

export async function generateStaticParams() {
  let posts = getProjectPosts();

  return (posts || []).map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  let post = getProjectPosts().find((post) => post.slug === slug);
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
      url: `${baseUrl}/project/${post.slug}`,
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

export default async function Project({ params }) {
  const { slug } = await params;
  let post = getProjectPosts().find((post) => post.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <section className="space-y-16">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProjectPosting",
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.publishedAt,
            description: post.metadata.person,
            image: post.metadata.image
              ? `${baseUrl}${post.metadata.image}`
              : `/og?title=${encodeURIComponent(post.metadata.title)}`,
            url: `${baseUrl}/project/${post.slug}`,
            author: {
              "@type": "Organization",
              name: "Fydemy",
            },
          }),
        }}
      />
      <div className="flex items-center gap-4 justify-between flex-wrap">
        <div className="flex flex-wrap items-center gap-4">
          <Image
            src={post.metadata.logo}
            alt={post.metadata.title}
            width={40}
            height={40}
          />
          <div className="space-y-1">
            <h1 className="title font-semibold text-2xl tracking-tighter">
              {post.metadata.title}
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {post.metadata.description}
            </p>
          </div>
        </div>
        <Link
          href={post.metadata.link!}
          className="bg-purple-600 text-white font-medium px-4 py-2 rounded-md text-sm flex items-center justify-center gap-x-2 sm:w-auto w-full"
        >
          View project
        </Link>
      </div>
      <article className="prose">
        <CustomMDX source={post.content} />
      </article>
      <ShareButtons
        url={`${baseUrl}/project/${post.slug}`}
        title={post.metadata.title}
        description={post.metadata.person}
      />
    </section>
  );
}
