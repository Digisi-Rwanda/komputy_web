import fs from "node:fs";
import path from "node:path";
import { HeroGradient } from "@/components/atoms/HeroGradient";

// Temporary asset gallery: proves every downloaded asset and font loads. Replace with the real landing page.
const list = (dir: string) =>
  fs.readdirSync(path.join(process.cwd(), "public", dir)).filter((f) => !f.startsWith(".")).map((f) => `/${dir}/${f}`);

const groups = [
  "logos/trusted",
  "icons",
  "illustrations",
  "inspiration/customer-logos",
  "inspiration/portraits",
  "textures",
  "brand",
];

const fonts = [
  ["Google Sans", "font-sans"],
  ["Google Sans Code", "font-mono"],
  ["Coustard", "font-serif"],
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 py-16">
      <section className="relative h-[480px] overflow-hidden rounded-[16px] border border-line">
        <HeroGradient />
        <div className="relative flex h-full flex-col items-center justify-center gap-4 text-center">
          <h1 className="text-[44px] font-medium leading-[1.15] tracking-[-0.04em] text-white">Ledgerline assets</h1>
          <button className="rounded-full bg-white px-5 py-2 text-black">Start free trial</button>
        </div>
      </section>

      <section className="mt-12 grid gap-2">
        {fonts.map(([name, cls]) => (
          <p key={name} className={`${cls} text-2xl text-white`}>
            {name} — RUN-0142 · USD 12,846,210.55
          </p>
        ))}
      </section>

      {groups.map((g) => (
        <section key={g} className="mt-12">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.04em] text-muted">{g}</h2>
          <div className="bg-blueprint mt-4 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-px border border-line">
            {list(g).map((src) => (
              <figure key={src} className="flex flex-col items-center gap-2 bg-canvas p-4 text-white">
                {/* eslint-disable-next-line @next/next/no-img-element -- gallery of mixed svg/png/webp */}
                <img src={src} alt="" className="h-16 w-full object-contain invert-0 [filter:brightness(0)_invert(1)] [&[src$='.png']]:filter-none [&[src$='.webp']]:filter-none [&[src$='.jpg']]:filter-none" />
                <figcaption className="font-mono text-[10px] text-muted break-all text-center">{src.split("/").pop()}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
