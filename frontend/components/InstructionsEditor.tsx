"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

function ToolButton({
  label,
  onClick,
  active = false,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded border border-gray-900 bg-gray-900 px-2 py-1 text-xs text-white"
          : "rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100"
      }
    >
      {label}
    </button>
  );
}

export default function InstructionsEditor({ value, onChange, placeholder }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Image,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[220px] px-3 py-2 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.view.dom.setAttribute("data-placeholder", placeholder || "Write instructions...");
  }, [editor, placeholder]);

  function insertImage(file: File | null) {
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === "string" ? reader.result : "";
      if (src) editor.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
  }

  if (!editor) return <div className="min-h-[220px] rounded border border-gray-300 bg-white">Loading editor...</div>;

  return (
    <div className="rounded border border-gray-300 bg-white">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 p-2">
        <ToolButton label="B" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} />
        <ToolButton label="I" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} />
        <ToolButton
          label="U"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
        />
        <ToolButton
          label="H2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
        />
        <ToolButton
          label="Bullet"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        />
        <ToolButton
          label="Ordered"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        />
        <ToolButton
          label="Left"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
        />
        <ToolButton
          label="Center"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
        />
        <ToolButton
          label="Right"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
        />

        <input
          type="color"
          aria-label="Text color"
          className="h-7 w-9 rounded border border-gray-300"
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100"
        >
          Image
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => insertImage(e.target.files?.[0] || null)}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
