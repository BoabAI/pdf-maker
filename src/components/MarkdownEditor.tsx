'use client';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function MarkdownEditor({ content, onChange }: MarkdownEditorProps) {
  return (
    <div className="w-full">
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your markdown content here...

# Example Heading
This is some **bold** text and *italic* text.

- List item 1
- List item 2

```javascript
const example = 'code block';
```"
        className="
          w-full h-96 p-4
          font-mono text-sm
          border-2 border-gray-300 rounded-lg
          focus:border-purple-500 focus:outline-none
          resize-none
          transition-colors duration-200
        "
      />
      <p className="text-sm text-gray-500 mt-2">
        {content.length} characters
      </p>
    </div>
  );
}
