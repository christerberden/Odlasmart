"use client";

import { useState } from "react";

type HelpItem = {
  title: string;
  text: string;
};

type InlineHelpPopoverProps = {
  ariaLabel: string;
  title: string;
  items: HelpItem[];
  buttonClassName?: string;
};

export function InlineHelpPopover({
  ariaLabel,
  title,
  items,
  buttonClassName = "help-button",
}: InlineHelpPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="today-help-anchor">
      <button
        aria-label={ariaLabel}
        className={`${buttonClassName} ${isOpen ? "is-open" : ""}`.trim()}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        ?
      </button>

      {isOpen ? (
        <div className="today-help-popup">
          <div className="today-help-popup-title">
            <strong>{title}</strong>
          </div>
          <div className="today-help-popup-grid">
            {items.map((item) => (
              <article className="today-help-popup-item" key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
