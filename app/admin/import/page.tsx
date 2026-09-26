'use client';

import { useState } from 'react';

interface ImportResult {
  success: boolean;
  total?: number;
  successCount?: number;
  errorCount?: number;
  errors?: string[];
  error?: string;
}

export default function BulkImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);         // clear previous result when a new file is chosen
      previewCSV(selectedFile);
    }
  };

  const previewCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).slice(0, 6);   // handle CRLF
      const rows = lines.slice(1).map((line) => line.split(','));
      setPreview(rows.filter((r) => r.length > 1));
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/import-students', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, error: 'Upload failed' });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `name,fatherName,studentId,className,parentPhone
Ali Khan,Nisar Ahmad,0044-26,Class 10,03001234567
Sara Ahmed,Ahmed Ali,0045-26,Class 9,03007654321`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--accent)' }}>
        Bulk Student Import
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Import Section */}
        <div
          className="p-6 rounded-xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-lg font-semibold mb-4">Import Students from CSV</h2>

          <button onClick={downloadTemplate} className="mb-4 btn-secondary text-sm">
            📥 Download CSV Template
          </button>

          <div
            className="border-2 border-dashed rounded-lg p-6 text-center mb-4"
            style={{ borderColor: 'var(--border)' }}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full"
            />
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
              Upload CSV file with student data
            </p>
          </div>

          {file && (
            <div className="mb-4">
              <p className="text-sm">
                <strong>File:</strong> {file.name}
              </p>
              <p className="text-sm">
                <strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="btn-primary w-full"
          >
            {loading ? 'Importing...' : 'Import Students'}
          </button>
        </div>

        {/* Results Section */}
        {result && (
          <div
            className="p-6 rounded-xl border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h2 className="text-lg font-semibold mb-4">Import Results</h2>
            {result.success ? (
              <div>
                <div className="text-green-500 text-2xl mb-2">✓ Import Complete</div>
                <p>
                  <strong>Total:</strong> {result.total}
                </p>
                <p>
                  <strong>Success:</strong> {result.successCount}
                </p>
                <p>
                  <strong>Failed:</strong> {result.errorCount}
                </p>
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="font-semibold">Errors:</p>
                    <ul className="text-sm text-red-500">
                      {result.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-500">Error: {result.error}</div>
            )}
          </div>
        )}
      </div>

      {/* Preview Section */}
      {preview.length > 0 && (
        <div
          className="mt-6 p-6 rounded-xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-lg font-semibold mb-4">Preview (First 5 rows)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Father Name</th>
                  <th className="p-2 text-left">Student ID</th>
                  <th className="p-2 text-left">Class</th>
                  <th className="p-2 text-left">Phone</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {/* Skip index 4 (email) — CSV template no longer includes it */}
                    {row.slice(0, 4).map((cell, j) => (
                      <td
                        key={j}
                        className="p-2"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {cell}
                      </td>
                    ))}
                    <td className="p-2" style={{ color: 'var(--text-secondary)' }}>
                      {row[5] ?? row[4] ?? ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div
        className="mt-6 p-6 rounded-xl border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <h3 className="font-semibold mb-2">📋 CSV Format Instructions</h3>
        <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
          <li>
            • First row must be headers: name,fatherName,studentId,className,parentPhone
          </li>
          <li>• name - Student's full name (required)</li>
          <li>• fatherName - Father's/Guardian's name (required)</li>
          <li>• studentId - Unique student ID (required)</li>
          <li>• className - Class name, e.g. "9" or "Class 9" (required)</li>
          <li>• parentPhone - Parent mobile for SMS (required)</li>
        </ul>
      </div>
    </div>
  );
}