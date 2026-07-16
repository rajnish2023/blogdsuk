import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef, useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote,
  Link as LinkIcon, Undo, Redo, Eraser, Code, ImagePlus, Upload,
  Table as TableIcon, Rows3, Columns3, Trash2, FileCode2, Loader2,
} from "lucide-react";
import { uploadMedia } from "../../api/galleryApi";

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        active ? "bg-signal text-white" : "text-muted hover:bg-paper hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export default function TipTapEditor({ value, onChange, placeholder = "Write your post...", variant = "default" }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [codeView, setCodeView] = useState(false);
  const [codeDraft, setCodeDraft] = useState("");

  const isMinimal = variant === "minimal";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: isMinimal ? false : { levels: [1, 2, 3] },
        blockquote: isMinimal ? false : {},
        bulletList: isMinimal ? false : {},
        orderedList: isMinimal ? false : {},
        codeBlock: isMinimal ? false : {},
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https", "mailto"],
        validate: (href) => /^https?:\/\//.test(href) || /^mailto:/.test(href),
      }),
      ...(isMinimal
        ? []
        : [
            Image.configure({ inline: false, allowBase64: false }),
            Table.configure({ resizable: false }),
            TableRow,
            TableHeader,
            TableCell,
          ]),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate: ({ editor: ed }) => onChange?.(ed.getHTML()),
    editorProps: {
      attributes: {
        class: `tiptap-content px-4 py-3 focus:outline-none ${isMinimal ? "min-h-[80px]" : "min-h-[260px]"}`,
      },
    },
  });

  useEffect(() => {
    if (!editor || codeView) return;
    const current = editor.getHTML();
    if (value !== undefined && value !== current) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor, codeView]);

  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes("link").href;
    const url = window.prompt("Link URL", previous || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertImageByUrl = () => {
    const url = window.prompt("Image URL", "https://");
    if (!url) return;
    const alt = window.prompt("Alt text (optional, recommended for SEO)", "") || "";
    editor.chain().focus().setImage({ src: url, alt }).run();
  };

  const triggerUpload = () => fileInputRef.current?.click();

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await uploadMedia([file], [""], () => {});
      const uploaded = data.items[0];
      editor.chain().focus().setImage({ src: uploaded.url, alt: uploaded.alt || file.name }).run();
    } catch (err) {
      window.alert(err?.response?.data?.message || "Upload failed — this needs gallery:upload permission");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const insertTable = () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  const inTable = editor.isActive("table");

  const toggleCodeView = () => {
    if (!codeView) {
      setCodeDraft(editor.getHTML());
      setCodeView(true);
    } else {
      editor.commands.setContent(codeDraft || "", true);
      onChange?.(editor.getHTML());
      setCodeView(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-paper-line bg-paper-card">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-paper-line bg-paper px-2 py-1.5">
        {!isMinimal && (
          <>
            <ToolbarButton title="Heading 1" active={editor.isActive("heading", { level: 1 })} disabled={codeView} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
              <Heading1 size={16} />
            </ToolbarButton>
            <ToolbarButton title="Heading 2" active={editor.isActive("heading", { level: 2 })} disabled={codeView} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              <Heading2 size={16} />
            </ToolbarButton>
            <ToolbarButton title="Heading 3" active={editor.isActive("heading", { level: 3 })} disabled={codeView} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
              <Heading3 size={16} />
            </ToolbarButton>

            <div className="mx-1 h-5 w-px bg-paper-line" />
          </>
        )}

        <ToolbarButton title="Bold" active={editor.isActive("bold")} disabled={codeView} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive("italic")} disabled={codeView} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton title="Underline" active={editor.isActive("underline")} disabled={codeView} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={16} />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor.isActive("strike")} disabled={codeView} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={16} />
        </ToolbarButton>
        {!isMinimal && (
          <ToolbarButton title="Inline code" active={editor.isActive("code")} disabled={codeView} onClick={() => editor.chain().focus().toggleCode().run()}>
            <Code size={16} />
          </ToolbarButton>
        )}

        <div className="mx-1 h-5 w-px bg-paper-line" />

        {!isMinimal && (
          <>
            <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} disabled={codeView} onClick={() => editor.chain().focus().toggleBulletList().run()}>
              <List size={16} />
            </ToolbarButton>
            <ToolbarButton title="Numbered list" active={editor.isActive("orderedList")} disabled={codeView} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
              <ListOrdered size={16} />
            </ToolbarButton>
            <ToolbarButton title="Quote" active={editor.isActive("blockquote")} disabled={codeView} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
              <Quote size={16} />
            </ToolbarButton>
          </>
        )}
        <ToolbarButton title="Link" active={editor.isActive("link")} disabled={codeView} onClick={setLink}>
          <LinkIcon size={16} />
        </ToolbarButton>

        {!isMinimal && (
          <>
            <div className="mx-1 h-5 w-px bg-paper-line" />

            <ToolbarButton title="Insert image by URL" disabled={codeView} onClick={insertImageByUrl}>
              <ImagePlus size={16} />
            </ToolbarButton>
            <ToolbarButton title="Upload image" disabled={codeView || uploading} onClick={triggerUpload}>
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            </ToolbarButton>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

            <ToolbarButton title="Insert table" active={inTable} disabled={codeView} onClick={insertTable}>
              <TableIcon size={16} />
            </ToolbarButton>
            {inTable && !codeView && (
              <>
                <ToolbarButton title="Add row" onClick={() => editor.chain().focus().addRowAfter().run()}>
                  <Rows3 size={16} />
                </ToolbarButton>
                <ToolbarButton title="Add column" onClick={() => editor.chain().focus().addColumnAfter().run()}>
                  <Columns3 size={16} />
                </ToolbarButton>
                <ToolbarButton title="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}>
                  <Trash2 size={16} />
                </ToolbarButton>
              </>
            )}
          </>
        )}

        <div className="mx-1 h-5 w-px bg-paper-line" />

        <ToolbarButton title="Clear formatting" disabled={codeView} onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
          <Eraser size={16} />
        </ToolbarButton>
        <ToolbarButton title="Undo" disabled={codeView || !editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          <Undo size={16} />
        </ToolbarButton>
        <ToolbarButton title="Redo" disabled={codeView || !editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          <Redo size={16} />
        </ToolbarButton>

        {!isMinimal && (
          <>
            <div className="mx-1 h-5 w-px bg-paper-line" />
            <ToolbarButton title={codeView ? "Back to visual editor" : "View/edit HTML source"} active={codeView} onClick={toggleCodeView}>
              <FileCode2 size={16} />
            </ToolbarButton>
          </>
        )}
      </div>

      {codeView ? (
        <textarea
          value={codeDraft}
          onChange={(e) => setCodeDraft(e.target.value)}
          spellCheck={false}
          rows={16}
          placeholder="<p>Post HTML...</p>"
          className="w-full resize-y bg-ink px-4 py-3 font-mono text-xs text-white placeholder:text-white/30 focus:outline-none"
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}

