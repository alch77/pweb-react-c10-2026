import type { ReactNode } from 'react';
import { motion } from 'motion/react';

interface MotionCardProps {
  children: ReactNode;
  className?: string;
  index?: number;
  hover?: boolean;
}

export function MotionCard({
  children,
  className,
  index = 0,
  hover = true,
}: MotionCardProps) {
  const delay = Math.min(index, 5) * 0.03;

  return (
    <motion.div
      className={className ? `card ${className}` : 'card'}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{
        duration: 0.22,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={
        hover
          ? {
              y: -2,
              borderColor: 'rgba(255, 255, 255, 0.24)',
              transition: { duration: 0.14, ease: 'easeOut' },
            }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
}
