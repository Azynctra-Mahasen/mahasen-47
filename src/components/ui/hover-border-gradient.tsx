"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
 
type Direction = "TOP" | "LEFT" | "BOTTOM" | "RIGHT";
 
export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = "button",
  duration = 1,
  clockwise = true,
  ...props
}: React.PropsWithChildren<
  {
    as?: React.ElementType;
    containerClassName?: string;
    className?: string;
    duration?: number;
    clockwise?: boolean;
  } & React.HTMLAttributes<HTMLElement>
>) {
  const [hovered, setHovered] = useState<boolean>(false);
  const [direction, setDirection] = useState<Direction>("TOP");
 
  const rotateDirection = (currentDirection: Direction): Direction => {
    const directions: Direction[] = ["TOP", "LEFT", "BOTTOM", "RIGHT"];
    const currentIndex = directions.indexOf(currentDirection);
    const nextIndex = clockwise
      ? (currentIndex - 1 + directions.length) % directions.length
      : (currentIndex + 1) % directions.length;
    return directions[nextIndex];
  };
 
  // Enhanced glow with more spread and opacity for light mode visibility
  const movingMap: Record<Direction, string> = {
    TOP: "radial-gradient(30% 70% at 50% 0%, hsl(252, 87%, 67%) 0%, rgba(139, 92, 246, 0) 100%)",
    LEFT: "radial-gradient(25% 60% at 0% 50%, hsl(252, 87%, 67%) 0%, rgba(139, 92, 246, 0) 100%)",
    BOTTOM: "radial-gradient(30% 70% at 50% 100%, hsl(252, 87%, 67%) 0%, rgba(139, 92, 246, 0) 100%)",
    RIGHT: "radial-gradient(25% 60% at 100% 50%, hsl(252, 87%, 67%) 0%, rgba(139, 92, 246, 0) 100%)",
  };
 
  const highlight =
    "radial-gradient(100% 200% at 50% 50%, #8B5CF6 0%, rgba(139, 92, 246, 0.2) 50%, rgba(139, 92, 246, 0) 100%)";
 
  useEffect(() => {
    if (!hovered) {
      const interval = setInterval(() => {
        setDirection((prevState) => rotateDirection(prevState));
      }, duration * 1000);
      return () => clearInterval(interval);
    }
  }, [hovered, duration]);

  return (
    <Tag
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative flex border content-center bg-black/20 hover:bg-black/10 transition duration-500 dark:bg-white/20 items-center flex-col flex-nowrap gap-10 h-min justify-center overflow-visible p-px decoration-clone w-fit",
        containerClassName
      )}
      {...props}
    >
      <div className={cn("w-auto z-10 bg-black rounded-[inherit]", className)}>
        {children}
      </div>
      <motion.div
        className="flex-none inset-0 overflow-hidden absolute z-0 rounded-[inherit]"
        style={{
          filter: "blur(8px)", // Increased blur for better glow effect
          position: "absolute",
          width: "100%",
          height: "100%",
          opacity: "0.8", // Added opacity for better visibility
        }}
        initial={{ background: movingMap[direction] }}
        animate={{
          background: hovered
            ? [movingMap[direction], highlight]
            : movingMap[direction],
        }}
        transition={{ ease: "linear", duration: duration ?? 1 }}
      />
      <div className="bg-black absolute z-1 flex-none inset-[2px] rounded-[inherit]" />
    </Tag>
  );
}