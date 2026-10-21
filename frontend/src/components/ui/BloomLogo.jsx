import React from "react";
import bloomLogoDark from "@/assets/bloom-logo-dark.png";
import bloomLogoWhite from "@/assets/bloom-logo-white.png";
import bloomLogoGradient from "@/assets/bloom-logo-gradient.png";
import bloomLogoRose from "@/assets/bloom-logo-rose.png";

/**
 * BloomLogo component
 * Renders the transparent Lotus Bloom logo tailored to background contexts:
 * - variant="dark": Crisp charcoal/black lines (ideal for light / white backgrounds)
 * - variant="white": Pure white lines (ideal for dark backgrounds / auth hero)
 * - variant="gradient": Rose-gold / sunset gradient lines (ideal for hover / colorful accents)
 * - variant="rose": Original plum/rose-brown lines
 */
const BloomLogo = ({
  variant = "dark",
  className = "w-9 h-9 object-contain",
  alt = "Bloom Logo",
  showText = false,
  textClassName = "font-cursive-bloom text-3xl tracking-wide text-neutral-900 leading-none select-none",
  text = "Bloom",
  containerClassName = "flex items-center gap-2.5",
}) => {
  let logoSrc = bloomLogoDark;
  if (variant === "white") logoSrc = bloomLogoWhite;
  else if (variant === "gradient") logoSrc = bloomLogoGradient;
  else if (variant === "rose") logoSrc = bloomLogoRose;

  const imageElement = (
    <img
      src={logoSrc}
      alt={alt}
      className={`select-none transition-transform duration-200 ${className}`}
      draggable={false}
    />
  );

  if (!showText) {
    return imageElement;
  }

  return (
    <div className={`select-none ${containerClassName}`}>
      {imageElement}
      <span className={textClassName}>{text}</span>
    </div>
  );
};

export default BloomLogo;
