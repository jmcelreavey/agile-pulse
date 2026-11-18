import { Box, Collapse, Paper, Text } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import EditableRichTextEditor from "~/app/components/base/rich-text-editor/EditableRichTextEditor";

interface CollapsibleRichTextEditorProps {
  title: string;
  initialContent?: string;
  placeholder?: string;
  locked?: boolean;
  onSave: (content: string) => Promise<void>;
  showLabel?: boolean;
  labelText?: string;
  labelColor?: string;
}

export default function CollapsibleRichTextEditor({
  title,
  initialContent,
  placeholder = "Click to add notes...",
  locked = false,
  onSave,
  showLabel = false,
  labelText,
  labelColor = "dimmed",
}: CollapsibleRichTextEditorProps) {
  const hasContent = initialContent && initialContent !== "<p></p>" && initialContent.trim() !== "";
  const [isExpanded, setIsExpanded] = useState(!!hasContent);
  const [isEditing, setIsEditing] = useState(false);
  const [currentContent, setCurrentContent] = useState(initialContent || "");
  const containerRef = useRef<HTMLDivElement>(null);

  // Don't collapse while editing to prevent the focus bug
  const currentHasContent = currentContent && currentContent !== "<p></p>" && currentContent.trim() !== "";
  const shouldCollapse = !currentHasContent && !isExpanded && !isEditing;

  const toggleExpanded = () => {
    if (!currentHasContent && !isEditing) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSave = async (content: string) => {
    await onSave(content);
    
    // Update current content and expanded state based on content after save
    setCurrentContent(content);
    const hasNewContent = content && content !== "<p></p>" && content.trim() !== "";
    if (!hasNewContent) {
      setIsExpanded(false);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    // After cancel, check if current content is empty and collapse if so
    const hasCurrentContent = currentContent && currentContent !== "<p></p>" && currentContent.trim() !== "";
    if (!hasCurrentContent) {
      setIsExpanded(false);
    }
    setIsEditing(false);
  };

  // Update currentContent when initialContent changes (after save)
  useEffect(() => {
    setCurrentContent(initialContent || "");
  }, [initialContent]);

  // Track when the editor is being used to prevent collapsing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleFocusIn = () => {
      setIsEditing(true);
      if (!isExpanded) {
        setIsExpanded(true);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      // Only set editing to false if focus is leaving the entire container
      if (!container.contains(e.relatedTarget as Node)) {
        setIsEditing(false);
      }
    };

    container.addEventListener('focusin', handleFocusIn);
    container.addEventListener('focusout', handleFocusOut);

    return () => {
      container.removeEventListener('focusin', handleFocusIn);
      container.removeEventListener('focusout', handleFocusOut);
    };
  }, [isExpanded]);

  return (
    <Paper withBorder>
      <Box
        ref={containerRef}
        p="md"
        style={{ cursor: shouldCollapse ? "pointer" : "default" }}
        onClick={shouldCollapse ? toggleExpanded : undefined}
      >
        <Box mb={showLabel ? "xs" : 0}>
          {showLabel && labelText && (
            <Text size="xs" c={labelColor} mb="xs">
              {labelText}
            </Text>
          )}
          <Text fw={500} size="sm">
            {title}
          </Text>
          {shouldCollapse && (
            <Text size="xs" c="dimmed">
              Click to add {title.toLowerCase()}
            </Text>
          )}
        </Box>
        
        <Collapse expanded={isExpanded || !!currentHasContent}>
          <Box mt="sm">
            <EditableRichTextEditor
              locked={locked}
              initialContent={currentContent}
              placeholder={placeholder}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
}
