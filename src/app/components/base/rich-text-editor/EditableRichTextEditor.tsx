import { Box, Button, Group, Paper } from "@mantine/core";
import { getTaskListExtension, Link, RichTextEditor } from "@mantine/tiptap";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TipTapTaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useCallback, useState } from "react";

interface EditableRichTextEditorProps {
  onSave: (content: string) => void;
  onCancel?: () => void;
  initialContent?: string;
  locked?: boolean;
  placeholder?: string;
}

function EditableRichTextEditor({
  onSave,
  onCancel,
  initialContent,
  locked,
  placeholder = "Click here to add information.",
}: EditableRichTextEditorProps) {
  const hasInitialContent = initialContent && initialContent !== "<p></p>";
  const [isEditable, setIsEditable] = useState(!hasInitialContent);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
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
        onReadOnlyChecked: () => {
          if (locked) return false;
          setIsEditable(false);
          onSave(editor?.getHTML() || "");
          return false;
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
    ],
    content: initialContent || "",
    editable: isEditable,
  });

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const isHyperlink = event.target instanceof HTMLAnchorElement;
      if (!isEditable && !isHyperlink && !locked) {
        setIsEditable(true);
        editor?.setEditable(true);
      }
    },
    [editor, isEditable, locked]
  );

  const handleCancel = useCallback(() => {
    setIsEditable(false);
    editor?.setEditable(false);
    // Reset content to initial state
    editor?.commands.setContent(initialContent || "");
    onCancel?.();
  }, [editor, initialContent, onCancel]);

  const handleSave = useCallback(() => {
    setIsEditable(false);
    editor?.setEditable(false);
    onSave(editor?.getHTML() || "");
  }, [editor, onSave]);

  if (!editor) {
    return null;
  }

  return (
    <Box onClick={handleClick}>
      {/* @ts-expect-error paper provides props */}
      <RichTextEditor component={Paper} withBorder shadow="md" editor={editor}>
        {isEditable && (
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
        )}

        <RichTextEditor.Content />

        {isEditable && (
          <Group justify="flex-end" m={12}>
            <Button onClick={handleSave}>Save</Button>
            <Button
              onClick={handleCancel}
              variant="light"
            >
              Cancel
            </Button>
          </Group>
        )}
      </RichTextEditor>
    </Box>
  );
}

export default EditableRichTextEditor;
