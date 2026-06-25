"use client";

const PHOTOS = [
  {
    src: "/reference/harness-1.jpeg",
    caption:
      "Harness overview near the battery bag: red/black power, yellow and green/teal signal wires, coaxial barrel connectors, and a blue/orange Higo 2-pin.",
  },
  {
    src: "/reference/harness-2.jpeg",
    caption:
      "At the Bosch Cargo Line motor: black 2-pin Higo (orange band) carrying red/black, plus green/teal and yellow taps.",
  },
  {
    src: "/reference/harness-3.jpeg",
    caption:
      "Harness fanned out: labeled yellow, green/teal, red and black wires terminating in coaxial light connectors.",
  },
];

export function ReferencePanel() {
  return (
    <div className="h-full overflow-y-auto p-3">
      <p className="mb-3 text-[11px] text-slate-400">
        Photos of the actual harness. Use them to confirm the modeled wiring
        matches your bike, then edit the DSL to match reality.
      </p>
      <div className="space-y-4">
        {PHOTOS.map((p, i) => (
          <figure
            key={p.src}
            className="overflow-hidden rounded-md border border-slate-700 bg-slate-800"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.src}
              alt={`Harness reference ${i + 1}`}
              className="w-full"
              loading="lazy"
            />
            <figcaption className="px-2 py-1.5 text-[10px] leading-snug text-slate-400">
              {p.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
