import CollapsibleRichTextEditor from "~/app/components/base/CollapsibleRichTextEditor";

interface SharedProjectSpaceProps {
  projectId?: number; // Optional since it's not currently used
  initialContent?: string;
  isReadOnly?: boolean;
  onSave?: (content: string) => Promise<void>;
  showLabel?: boolean;
  labelText?: string;
}

export default function SharedProjectSpace({
  projectId: _projectId, // Prefix with underscore to indicate intentionally unused
  initialContent,
  isReadOnly = false,
  onSave,
  showLabel = false,
  labelText = "Shared with customer",
}: SharedProjectSpaceProps) {
  // For read-only mode, we still want to show the component but without edit functionality
  if (isReadOnly) {
    const hasContent = initialContent && initialContent !== "<p></p>" && initialContent.trim() !== "";
    
    if (!hasContent) {
      return null; // Don't show anything for customers if there's no content
    }

    return (
      <CollapsibleRichTextEditor
        title="Project Resources"
        initialContent={initialContent}
        placeholder="No shared notes available"
        locked={true}
        onSave={async () => Promise.resolve()} // No-op for read-only
        showLabel={showLabel}
        labelText={labelText}
      />
    );
  }

  return (
    <CollapsibleRichTextEditor
      title="" // No title on developer side, label is sufficient
      initialContent={initialContent}
      placeholder="Add shared notes, links, and important resources that will be visible to customers."
      locked={isReadOnly}
      onSave={onSave || (async () => Promise.resolve())}
      showLabel={showLabel}
      labelText={labelText}
    />
  );
}
