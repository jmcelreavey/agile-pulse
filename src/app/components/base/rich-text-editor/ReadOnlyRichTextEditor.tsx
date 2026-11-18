import { Box, Paper } from "@mantine/core";
import { getTaskListExtension, Link, RichTextEditor } from "@mantine/tiptap";
import TaskItem from "@tiptap/extension-task-item";
import TipTapTaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { markdownToHtml } from "~/shared/utils/markdownToHtml";

interface ReadOnlyRichTextEditorProps {
  content?: string;
  withBorder?: boolean;
  shadow?: string;
  compact?: boolean;
}

function ReadOnlyRichTextEditor({
  content,
  withBorder = false,
  shadow,
  compact = false,
}: ReadOnlyRichTextEditorProps) {
  // Convert markdown content to HTML if it looks like markdown
  const processedContent = content ? markdownToHtml(content) : "";

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      getTaskListExtension(TipTapTaskList),
      TaskItem.configure({
        nested: true,
        onReadOnlyChecked: () => false, // Prevent any interaction
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
    ],
    content: processedContent || "",
    editable: false,
  });

  if (!editor || !content) {
    return null;
  }

  const WrapperComponent = withBorder || shadow ? Paper : Box;
  const wrapperProps =
    withBorder || shadow
      ? { withBorder, shadow, p: compact ? "xs" : "md" }
      : { p: compact ? "xs" : 0 };

  return (
    <WrapperComponent {...wrapperProps}>
      <RichTextEditor editor={editor}>
        <RichTextEditor.Content />
      </RichTextEditor>
    </WrapperComponent>
  );
}

export default ReadOnlyRichTextEditor;
