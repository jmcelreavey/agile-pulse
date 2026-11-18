import { Box, Paper } from "@mantine/core";
import { getTaskListExtension, Link, RichTextEditor } from "@mantine/tiptap";
import TaskItem from "@tiptap/extension-task-item";
import TipTapTaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, type ReactNode } from "react";
import {
  isMarkdownContent,
  markdownToHtml,
} from "~/shared/utils/markdownToHtml";

interface FormRichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  error?: ReactNode;
  label?: string;
  disabled?: boolean;
}

function FormRichTextEditor({
  value,
  onChange,
  onBlur,
  error,
  label,
  disabled = false,
}: FormRichTextEditorProps) {
  // Convert markdown to HTML if the incoming value looks like markdown
  const processedValue =
    value && isMarkdownContent(value) ? markdownToHtml(value) : value || "";

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      getTaskListExtension(TipTapTaskList),
      TaskItem.configure({
        nested: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
    ],
    content: processedValue || "",
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    onBlur: () => {
      onBlur?.();
    },
  });

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && processedValue !== editor.getHTML()) {
      editor.commands.setContent(processedValue || "");
    }
  }, [editor, processedValue]);

  // Update disabled state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  if (!editor) {
    return null;
  }

  return (
    <Box>
      {label && (
        <Box
          component="label"
          fz="sm"
          fw={500}
          mb={5}
          style={{ display: "block" }}
        >
          {label}
        </Box>
      )}
      <Paper withBorder style={{ borderColor: error ? "red" : undefined }}>
        <RichTextEditor editor={editor} mih={120}>
          <RichTextEditor.Toolbar sticky stickyOffset={60}>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Bold />
              <RichTextEditor.Italic />
              <RichTextEditor.Underline />
              <RichTextEditor.Strikethrough />
              <RichTextEditor.ClearFormatting />
              <RichTextEditor.Highlight />
              <RichTextEditor.Code />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.H1 />
              <RichTextEditor.H2 />
              <RichTextEditor.H3 />
              <RichTextEditor.H4 />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.AlignLeft />
              <RichTextEditor.AlignCenter />
              <RichTextEditor.AlignRight />
              <RichTextEditor.AlignJustify />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Blockquote />
              <RichTextEditor.Hr />
              <RichTextEditor.BulletList />
              <RichTextEditor.OrderedList />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Link />
              <RichTextEditor.Unlink />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.TaskList />
              <RichTextEditor.TaskListLift />
              <RichTextEditor.TaskListSink />
            </RichTextEditor.ControlsGroup>
          </RichTextEditor.Toolbar>
          <RichTextEditor.Content />
        </RichTextEditor>
      </Paper>
      {error && (
        <Box mt={5} fz="sm" c="red">
          {error}
        </Box>
      )}
    </Box>
  );
}

export default FormRichTextEditor;
