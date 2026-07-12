import { useRef, useState, type MouseEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../services/endpoints";
import { getErrorMessage } from "../services/api";
import type { Visibility } from "../types";
import createPostHtml from "../design/create_post.html?raw";

/** Create-post card — exact feed.html markup, wired to the API */
export function CreatePost() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async () => {
      const root = rootRef.current;
      const ta = root?.querySelector("textarea") as HTMLTextAreaElement | null;
      const sel = root?.querySelector("select._visibility_select") as HTMLSelectElement | null;
      const text = (ta?.value ?? "").trim();
      if (!text) throw new Error("Write something before posting");
      const visibility = (sel?.value as Visibility) || "PUBLIC";
      return api.createPost({ content: text, visibility, image });
    },
    onSuccess: () => {
      setImage(null);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      const root = rootRef.current;
      const ta = root?.querySelector("textarea");
      if (ta) ta.value = "";
      const sel = root?.querySelector("select._visibility_select") as HTMLSelectElement | null;
      if (sel) sel.value = "PUBLIC";
      void qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  function onClick(e: MouseEvent<HTMLDivElement>) {
    const t = e.target as HTMLElement;
    if (t.closest("._feed_inner_text_area_bottom_photo")) {
      e.preventDefault();
      fileRef.current?.click();
      return;
    }
    if (t.closest("._feed_inner_text_area_btn_link")) {
      e.preventDefault();
      create.mutate();
    }
  }

  return (
    <div>
      {preview && (
        <div className="_feed_inner_text_area _b_radious6 _padd_r24 _padd_l24 _padd_t16 _mar_b0">
          <img src={preview} alt="Preview" className="_post_image_preview" />
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          setImage(file);
          setPreview(file ? URL.createObjectURL(file) : null);
        }}
      />
      <div ref={rootRef} onClick={onClick} dangerouslySetInnerHTML={{ __html: createPostHtml }} />
      {create.isError && <p className="_form_error _padd_l24">{getErrorMessage(create.error)}</p>}
    </div>
  );
}
