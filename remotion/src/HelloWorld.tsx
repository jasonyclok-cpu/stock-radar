import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";

export const helloWorldSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  accentColor: z.string(),
});

export const HelloWorld: React.FC<z.infer<typeof helloWorldSchema>> = ({
  title,
  subtitle,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Title pops in with a spring.
  const titleScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 120, mass: 0.6 },
  });

  // Subtitle fades + slides up slightly after the title.
  const subtitleProgress = spring({
    frame: frame - 12,
    fps,
    config: { damping: 18, stiffness: 90 },
  });
  const subtitleOpacity = interpolate(subtitleProgress, [0, 1], [0, 1]);
  const subtitleY = interpolate(subtitleProgress, [0, 1], [40, 0]);

  // Slow background drift for some life.
  const bgShift = interpolate(frame, [0, durationInFrames], [0, 30]);

  // Accent bar grows out from the center.
  const barWidth = interpolate(spring({ frame: frame - 6, fps }), [0, 1], [0, 320]);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at ${50 + bgShift}% ${30 - bgShift}%, #1b2440 0%, #0b0f1d 70%)`,
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 80,
          textAlign: "center",
        }}
      >
        <div
          style={{
            transform: `scale(${titleScale})`,
            color: "white",
            fontSize: 120,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          {title}
        </div>

        <div
          style={{
            height: 10,
            width: barWidth,
            background: accentColor,
            borderRadius: 999,
            marginTop: 48,
            marginBottom: 48,
          }}
        />

        <div
          style={{
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
            color: "rgba(255,255,255,0.78)",
            fontSize: 52,
            fontWeight: 500,
            maxWidth: 820,
          }}
        >
          {subtitle}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
