"use client";

import { useState, useTransition } from "react";
import { addItemsToReview } from "../../actions";

export function AddToReviewButton({
  lang,
  itemIds,
  initiallyAdded,
  labels,
}: {
  lang: string;
  itemIds: string[];
  initiallyAdded: boolean;
  labels: { add: string; added: string };
}) {
  const [added, setAdded] = useState(initiallyAdded);
  const [pending, start] = useTransition();
  return (
    <button
      className={added ? "btn-ghost" : "btn-primary"}
      disabled={added || pending}
      onClick={() =>
        start(async () => {
          await addItemsToReview(lang, itemIds);
          setAdded(true);
        })
      }
    >
      {added ? labels.added : `🔁 ${labels.add}`}
    </button>
  );
}
