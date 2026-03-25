"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export default function InstructionsEditor({ value, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[200px] px-3 py-2 focus:outline-none",
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

  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (el && editor) {
        el.querySelector("[contenteditable]")?.setAttribute("data-placeholder", placeholder || "Write instructions...");
      }
    },
    [editor, placeholder]
  );

  if (!editor) return <div className="min-h-[200px] rounded border border-gray-300 bg-white">Loading editor...</div>;

  return (
    <div ref={setRef} className="rounded border border-gray-300 bg-white">
      <EditorContent editor={editor} />
    </div>
  );
}
