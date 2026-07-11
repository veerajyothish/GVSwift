"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.6,
  y = 24,
  className = "",
  style,
}: FadeInProps) {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : y },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : duration,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
        delay: shouldReduceMotion ? 0.01 : delay,
      },
    },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: React.ReactNode;
  delayChildren?: number;
  staggerChildren?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function StaggerContainer({
  children,
  delayChildren = 0.1,
  staggerChildren = 0.08,
  className = "",
  style,
}: StaggerContainerProps) {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0.001 : staggerChildren,
        delayChildren: shouldReduceMotion ? 0.001 : delayChildren,
      },
    },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

interface StaggerChildProps {
  children: React.ReactNode;
  y?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function StaggerChild({
  children,
  y = 20,
  duration = 0.5,
  className = "",
  style,
}: StaggerChildProps) {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : y },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : duration,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <motion.div variants={variants} className={className} style={style}>
      {children}
    </motion.div>
  );
}
