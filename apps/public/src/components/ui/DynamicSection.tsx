/**
 * DynamicSection.tsx
 *
 * Wraps any section in animation + style from the admin-configured PageSection.
 * Used in public pages to make sections controllable without code changes.
 */
import { CSSProperties, ReactNode } from 'react';
import { motion, type Variant, type Variants } from 'framer-motion';
import type { SectionAnimation, SectionStyle } from '../../hooks/useSections';

// ── Animation variants builder ────────────────────────────────────────────────

function buildVariants(anim: SectionAnimation): Variants {
  const dist = 32;
  const offsets: Record<string, { x?: number; y?: number }> = {
    up:    { y: dist },
    down:  { y: -dist },
    left:  { x: dist },
    right: { x: -dist },
  };
  const offset = offsets[anim.direction ?? 'up'] ?? { y: dist };

  const durations: Record<string, number> = { fast: 0.35, normal: 0.6, slow: 0.9 };
  const duration = durations[anim.duration ?? 'normal'] ?? 0.6;

  const hidden: Variant = { opacity: 0, ...offset };
  const visible: Variant = {
    opacity: 1, x: 0, y: 0,
    transition: { duration, ease: [0.22, 1, 0.36, 1], delay: anim.delay ?? 0 },
  };

  if (anim.type === 'scale') {
    hidden['scale'] = 0.94;
    visible['scale'] = 1;
  }
  if (anim.type === 'blur') {
    hidden['filter'] = 'blur(12px)';
    visible['filter'] = 'blur(0px)';
  }
  if (anim.type === 'none') {
    return { hidden: {}, visible: { transition: { duration: 0 } } };
  }

  return { hidden, visible };
}

// ── Style resolver ────────────────────────────────────────────────────────────

function buildStyle(style: SectionStyle): CSSProperties {
  const css: CSSProperties = {};
  if (style.bgColor)   css.backgroundColor = style.bgColor;
  if (style.textColor) css.color = style.textColor;
  if (style.gradient)  css.background = style.gradient;

  const padMap: Record<string, string> = {
    compact: '2rem 0',
    normal: '4rem 0',
    spacious: '6rem 0',
  };
  css.padding = padMap[style.spacing ?? 'normal'] ?? '4rem 0';

  return css;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface DynamicSectionProps {
  animation?: SectionAnimation;
  style?: SectionStyle;
  className?: string;
  children: ReactNode;
  noAnimate?: boolean;
}

export function DynamicSection({
  animation = {},
  style = {},
  className = '',
  children,
  noAnimate = false,
}: DynamicSectionProps) {
  const sectionStyle = buildStyle(style);

  if (noAnimate || animation.type === 'none') {
    return (
      <div className={className} style={sectionStyle}>
        {children}
      </div>
    );
  }

  const variants = buildVariants(animation);
  const isScroll = animation.trigger === 'scroll';

  return (
    <motion.div
      className={className}
      style={sectionStyle}
      variants={variants}
      initial="hidden"
      {...(isScroll
        ? { whileInView: 'visible', viewport: { once: true, margin: '-80px' } }
        : { animate: 'visible' }
      )}
    >
      {children}
    </motion.div>
  );
}

// ── Section heading ──────────────────────────────────────────────────────────

interface SectionHeadingProps {
  title?: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

export function SectionHeading({ title, subtitle, centered = false, className = '' }: SectionHeadingProps) {
  if (!title && !subtitle) return null;
  return (
    <div className={`mb-10 ${centered ? 'text-center' : ''} ${className}`}>
      {title && (
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="mt-3 text-lg" style={{ color: '#64748b' }}>{subtitle}</p>
      )}
    </div>
  );
}
