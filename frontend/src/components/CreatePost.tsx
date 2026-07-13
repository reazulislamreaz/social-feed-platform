import { useRef, useState, type MouseEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../services/endpoints";
import type { Visibility } from "../types";
import { toast } from "../utils/toast";
import createPostHtml from "../design/create_post.html?raw";

/** Create-post card — exact feed.html markup, wired to the API */
export function CreatePost() {
  const [preview, setPreview] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Keep latest file in a ref so mutate() never posts a stale null image
  const imageRef = useRef<File | null>(null);
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async () => {
      const root = rootRef.current;
      const ta = root?.querySelector("textarea") as HTMLTextAreaElement | null;
      const sel = root?.querySelector("select._visibility_select") as HTMLSelectElement | null;
      const text = (ta?.value ?? "").trim();
      if (!text) throw new Error("Write something before posting");
      const visibility = (sel?.value as Visibility) || "PUBLIC";
      return api.createPost({
        content: text,
        visibility,
        image: imageRef.current,
      });
    },
    onSuccess: () => {
      if (preview) URL.revokeObjectURL(preview);
      imageRef.current = null;
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      const root = rootRef.current;
      const ta = root?.querySelector("textarea");
      if (ta) ta.value = "";
      const sel = root?.querySelector("select._visibility_select") as HTMLSelectElement | null;
      if (sel) sel.value = "PUBLIC";
      void qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Post published");
    },
    onError: (err) => toast.fromError(err, "Could not create post"),
  });

  function onClick(e: MouseEvent<HTMLDivElement>) {
    const t = e.target as HTMLElement;
    if (t.closest("._feed_inner_text_area_bottom_photo")) {
      e.preventDefault();
      e.stopPropagation();
      fileRef.current?.click();
      return;
    }
    if (t.closest("._feed_inner_text_area_btn_link")) {
      e.preventDefault();
      e.stopPropagation();
      if (!create.isPending) create.mutate();
    }
  }

  return (
    <div>
      {preview && (
        <div className="_feed_inner_text_area _b_radious6 _padd_r24 _padd_l24 _padd_t16 _mar_b0">
          <img src={preview} alt="Preview" className="_post_image_preview" />
          <button
            type="button"
            className="_remove_image_btn"
            onClick={() => {
              if (preview) URL.revokeObjectURL(preview);
              imageRef.current = null;
              setPreview(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
          >
            Remove photo
          </button>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          if (preview) URL.revokeObjectURL(preview);
          imageRef.current = file;
          setPreview(file ? URL.createObjectURL(file) : null);
          if (file) toast.info("Photo attached");
        }}
      />
      <div
        ref={rootRef}
        onClick={onClick}
        style={{ opacity: create.isPending ? 0.7 : 1, pointerEvents: create.isPending ? "none" : "auto" }}
        dangerouslySetInnerHTML={{ __html: createPostHtml }}
      />
      {create.isPending && (
        <p className="text-muted _padd_l24 _padd_b8">Posting…</p>
      )}
    </div>
  );
}
