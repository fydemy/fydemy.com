import { Sparkle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { GitHub } from "./components/icon/github";
import { Discord } from "./components/icon/discord";
import { YouTube } from "./components/icon/youtube";
import { LinkedIn } from "./components/icon/linkedin";
import { TikTok } from "./components/icon/tiktok";
import { Instagram } from "./components/icon/instagram";
import { NPM } from "./components/icon/npm";

export default function Page() {
  return (
    <div>
      <div className="relative mb-20! sm:mt-4!">
        <div className="relative">
          <Image
            src="/web/cover.png"
            alt="ForYou Academy"
            width={200}
            height={200}
            className="w-full sm:rounded-2xl aspect-[4/3] sm:aspect-[4/1] object-cover"
          />
          <div className="absolute -space-x-1 -bottom-10 right-2 sm:right-0 flex">
            <Image
              src="/logo/dicoding.jpeg"
              alt="dicoding"
              width={25}
              height={25}
              className="rounded-full object-cover"
            />
            <Image
              src="/logo/kredivo.png"
              alt="dicoding"
              width={25}
              height={25}
              className="rounded-full object-cover outline-2 outline-white"
            />
            <Image
              src="/logo/tiket.webp"
              alt="dicoding"
              width={25}
              height={25}
              className="rounded-full object-cover outline-2 outline-white"
            />
            <Image
              src="/logo/xendit.jpeg"
              alt="dicoding"
              width={25}
              height={25}
              className="rounded-full object-cover outline-2 outline-white"
            />
            <Image
              src="/logo/ntt.jpeg"
              alt="dicoding"
              width={25}
              height={25}
              className="rounded-full object-cover outline-2 outline-white"
            />
          </div>
        </div>
        <Image
          src="/web/fav.svg"
          alt="ForYou Academy"
          width={100}
          height={100}
          className="rounded-2xl size-20 sm:size-24 absolute -bottom-10 left-10 outline-8 outline-white dark:outline-black"
        />
      </div>
      <section className="prose px-10">
        <div>
          <h1 className="font-bold! tracking-tighter!">ForYou Academy</h1>
          <p>We're building open-source projects and empowering learning! 🚀</p>
          <div className="w-full flex flex-wrap gap-1.5 items-center mt-10!">
            <Link
              className="cursor-pointer"
              href="https://drive.google.com/file/d/18TIBLzK5D5f0kNYhvrIIVuhHuWOXW__y/view?usp=drive_link"
            >
              <Image
                src="/talent/contributor/dennis.png"
                alt="dennis"
                width={25}
                height={25}
                className="rounded-full object-cover aspect-square! outline-2 outline-green-500"
              />
            </Link>
            <Link className="cursor-pointer" href="https://iriyanto.com">
              <Image
                src="/talent/contributor/iriyanto.png"
                alt="dennis"
                width={25}
                height={25}
                className="rounded-full object-cover aspect-square! outline-2 outline-green-500"
              />
            </Link>
            <Link className="cursor-pointer" href="https://januantara.dev">
              <Image
                src="/talent/contributor/januantara.jpg"
                alt="dennis"
                width={25}
                height={25}
                className="rounded-full object-cover aspect-square! outline-2 outline-green-500"
              />
            </Link>
            <Link className="cursor-pointer" href="https://andriawan.dev">
              <Image
                src="/talent/contributor/naufal.png"
                alt="dennis"
                width={25}
                height={25}
                className="rounded-full object-cover aspect-square! outline-2 outline-green-500"
              />
            </Link>
            <Link className="cursor-pointer" href="https://wahyuikbal.com">
              <Image
                src="/talent/contributor/wahyu.png"
                alt="dennis"
                width={25}
                height={25}
                className="rounded-full object-cover aspect-square! outline-2 outline-green-500"
              />
            </Link>
            <Link className="cursor-pointer" href="https://wahyuivan.dev">
              <Image
                src="/talent/mentor/wahyuivan.webp"
                alt="dennis"
                width={25}
                height={25}
                className="rounded-full object-cover aspect-square! outline-2 outline-yellow-500"
              />
            </Link>
            <Link className="cursor-pointer" href="https://abdielz.tech">
              <Image
                src="/talent/speaker/abdiel.png"
                alt="dennis"
                width={25}
                height={25}
                className="rounded-full object-cover aspect-square! outline-2 outline-purple-500"
              />
            </Link>
            <Link
              className="cursor-pointer"
              href="https://www.linkedin.com/in/adityaputras/"
            >
              <Image
                src="/talent/speaker/aditya.png"
                alt="dennis"
                width={25}
                height={25}
                className="rounded-full object-cover aspect-square! outline-2 outline-purple-500"
              />
            </Link>
            <Link
              className="cursor-pointer"
              href="https://daffabadrant9390.github.io/"
            >
              <Image
                src="/talent/speaker/daffa.png"
                alt="dennis"
                width={25}
                height={25}
                className="rounded-full object-cover aspect-square! outline-2 outline-purple-500"
              />
            </Link>
            <Link className="cursor-pointer" href="https://nathanl.my.id">
              <Image
                src="/talent/speaker/nathan.png"
                alt="dennis"
                width={25}
                height={25}
                className="rounded-full object-cover aspect-square! outline-2 outline-purple-500"
              />
            </Link>
            <div className="font-bold">85+</div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-16 mt-16!">
          <Link
            href="https://github.com/fydemy"
            className="no-underline! leading-0!"
          >
            <GitHub className="size-6 -mb-2 dark:brightness-200" />
            <h2 className="font-bold">Project @Github</h2>
            <p>Explore our opensource projects</p>
          </Link>
          <Link
            href="https://luma.com/fydemy"
            className="no-underline! leading-0!"
          >
            <Sparkle className="size-6 fill-black dark:fill-white -mb-2!" />
            <h2 className="font-bold">Events @Luma</h2>
            <p>Explore our events</p>
          </Link>
          <Link
            href="https://docs.fydemy.com"
            className="no-underline! leading-0!"
          >
            <Image
              src="/web/fav.svg"
              alt="ForYou Academy"
              width={25}
              height={25}
              className="rounded-full -mb-2!"
            />
            <h2 className="font-bold">Learning @Docs</h2>
            <p>Learn and get certified</p>
          </Link>
          <Link
            href="https://discord.gg/7FBpTEXqVj"
            className="no-underline! leading-0!"
          >
            <Discord className="size-6 -mb-2!" />
            <h2 className="font-bold">Community @Discord</h2>
            <p>Get reviewed and help others</p>
          </Link>
          <Link
            href="https://www.youtube.com/@fydemy"
            className="no-underline! leading-0!"
          >
            <YouTube className="size-6 -mb-2!" />
            <h2 className="font-bold">Recording @YouTube</h2>
            <p>Watch our recordings</p>
          </Link>
          <Link
            href="https://www.linkedin.com/company/fydemy"
            className="no-underline! leading-0!"
          >
            <LinkedIn className="size-6 -mb-2!" />
            <h2 className="font-bold">Company @LinkedIn</h2>
            <p>See our latest news</p>
          </Link>
          <Link
            href="https://www.tiktok.com/@fydemy"
            className="no-underline! leading-0!"
          >
            <TikTok className="size-6 -mb-2!" />
            <h2 className="font-bold">Watch series</h2>
            <p>1.7K+ followers</p>
          </Link>
          <Link
            href="https://www.instagram.com/fydemy/"
            className="no-underline! leading-0!"
          >
            <Instagram className="size-6 -mb-2!" />
            <h2 className="font-bold">Watch series</h2>
            <p>4M+ engangements</p>
          </Link>
          <Link
            href="https://www.npmjs.com/~fydemy"
            className="no-underline! leading-0!"
          >
            <NPM className="size-6 -mb-2!" />
            <h2 className="font-bold">Packages</h2>
            <p>1K+ downloads</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
