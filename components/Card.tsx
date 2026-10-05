"use client";

import { cardClass, cardLabel } from "@/lib/uno";
import type { UnoCard } from "@/lib/types";

interface CardProps {
  card: UnoCard;
  playable?: boolean;
  small?: boolean;
  onClick?: () => void;
}

export default function Card({ card, playable = false, small = false, onClick }: CardProps) {
  const content = (
    <span className={"uno-card card-" + cardClass(card) + (small ? " card-small" : "") + (playable ? " card-playable" : "")}>
      <span className="card-corner">{cardLabel(card)}</span>
      <span className="card-center">{cardLabel(card)}</span>
      <span className="card-corner card-corner-bottom">{cardLabel(card)}</span>
    </span>
  );

  return onClick ? (
    <button type="button" className="card-button" onClick={onClick} aria-label={"Jouer " + cardLabel(card)}>
      {content}
    </button>
  ) : content;
}