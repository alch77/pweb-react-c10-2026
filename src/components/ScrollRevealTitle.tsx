import { Fragment, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'b' | 'span';

interface ScrollRevealTitleProps {
  text: string;
  as?: HeadingTag;
  className?: string;
}

export function ScrollRevealTitle({
  text,
  as: Tag = 'h3',
  className,
}: ScrollRevealTitleProps) {
  const containerRef = useRef<HTMLElement>(null);
  const words = text.trim().split(/\s+/).filter(Boolean);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const ctx = gsap.context(() => {
      const wordEls = el.querySelectorAll('.reveal-word-inner');
      if (wordEls.length === 0) return;

      gsap.fromTo(
        wordEls,
        { yPercent: 110, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.07,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 92%',
            once: true,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [text]);

  return (
    <Tag
      ref={containerRef as never}
      className={className ? `reveal-title ${className}` : 'reveal-title'}
    >
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <span className="reveal-word">
            <span className="reveal-word-inner">{word}</span>
          </span>
          {index < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Tag>
  );
}
