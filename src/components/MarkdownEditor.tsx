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
          w-full h-80 p-4
          font-mono text-sm text-gray-700
          bg-white
          border-2 border-violet-200 rounded-xl
          focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:outline-none
          resize-none
          transition-all duration-200
          placeholder:text-gray-300
        "
      />
      <div className="flex justify-between items-center mt-2 px-1">
        <p className="text-xs text-gray-400">
          Supports standard markdown syntax
        </p>
        <p className="text-xs text-violet-400 font-medium">
          {content.length.toLocaleString()} characters
        </p>
      </div>
    </div>
  );
}
