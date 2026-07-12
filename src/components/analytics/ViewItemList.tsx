"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics/ga4";
import { mapProductToGa4Item } from "@/lib/analytics/ecommerce";

interface ViewItemListProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: any[];
  listId: string;
  listName: string;
  children?: React.ReactNode;
}

export function ViewItemList({ products, listId, listName, children }: ViewItemListProps) {
  const fired = useRef(false);

  useEffect(() => {
    // Only fire once per mount when products are ready
    if (!fired.current && products && products.length > 0) {
      fired.current = true;
      trackEvent("view_item_list", {
        item_list_id: listId,
        item_list_name: listName,
        items: products.map((p, index) =>
          mapProductToGa4Item(p, { index: index + 1, item_list_id: listId, item_list_name: listName })
        ),
      });
    }
  }, [products, listId, listName]);

  return <>{children}</>;
}
