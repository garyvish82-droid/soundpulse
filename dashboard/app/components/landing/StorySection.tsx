import { InstagramIcon, LinkedInIcon } from "@/components/icons";

const STORY_PARAGRAPHS = [
  "I built this because I'm the user.",
  "12+ years building products and leading complex deliveries — and a DJ, producer, and live performer who's used SoundCloud my whole career. I've always felt the gap: SoundCloud gives you play counts, not the reason one track pulls repost after repost while another with the same like-rate barely moves.",
  "SoundPulse is how I explored that gap — and a demonstration of what a non-engineer PM can architect and ship solo. Built in 13 weeks with Claude as co-pilot, on real production infrastructure: AWS Lambda, Supabase, Next.js, and the Anthropic API. Real infrastructure, not a mockup.",
  "The point isn't the product — it's what's possible when someone who understands music, product, and AI works the same problem.",
];

export default function StorySection() {
  return (
    <section id="story" className="mx-auto max-w-[900px] px-5 py-20 sm:px-8">
      <div className="grid items-start gap-8 sm:grid-cols-[260px_1fr]">
        <div>
          <p className="mb-4 font-mono text-[0.7rem] tracking-[0.12em] text-brand">THE BUILDER</p>
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-xl"
            style={{ background: "linear-gradient(135deg, var(--color-brand), var(--color-brand-2))" }}
            aria-hidden="true"
          >
            🎛️
          </div>
          <div className="font-mono text-[0.8rem] leading-[2] text-text-faint">
            <div>Garik Vishnevski</div>
            <div>PM · 8 years</div>
            <div>Project Manager · 8 years</div>
            <div>DJ · Producer · Live</div>
            <div className="mt-3 flex gap-3">
              <a
                href="https://www.instagram.com/garyvish"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-text-faint transition-colors hover:text-[#e1306c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <InstagramIcon size={14} />
                Instagram
              </a>
              <a
                href="https://www.linkedin.com/in/garik-vishnevski"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-text-faint transition-colors hover:text-[#0a66c2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <LinkedInIcon size={14} />
                LinkedIn
              </a>
            </div>
          </div>
        </div>
        <div>
          <div className="flex flex-col gap-4">
            {STORY_PARAGRAPHS.map((para) => (
              <p key={para} className="text-[0.9rem] leading-[1.75] text-text-muted">
                {para}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
