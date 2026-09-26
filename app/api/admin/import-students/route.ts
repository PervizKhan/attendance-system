// app/api/admin/import-students/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Student from '@/lib/models/Student';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/);

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV is empty' }, { status: 400 });
    }

    const headers = lines[0].toLowerCase().split(',').map((h) => h.trim());
    console.log('Headers found:', headers);

    const errors: string[] = [];
    let successCount = 0;
    let processedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      processedCount++;

      const values = line.split(',').map((v) => v.trim());
      const studentData: Record<string, string> = {};

      headers.forEach((header, idx) => {
        const val = values[idx] ?? '';
        if (header === 'name') studentData.name = val;
        else if (header === 'fathername') studentData.fatherName = val;
        else if (header === 'studentid') studentData.studentId = val;
        else if (header === 'classname') studentData.className = val;
        else if (header === 'classnumber') {
          const classNum = parseInt(val);
          if (!isNaN(classNum) && classNum >= 1 && classNum <= 12) {
            studentData.className = `Class ${classNum}`;
          } else {
            studentData.className = val;
          }
        }
        else if (header === 'parentphone') studentData.parentPhone = val;
        else if (header === 'address') studentData.address = val;
        else if (header === 'rollno') studentData.rollNo = val;
        // contactemail, contactphone, notificationmethod: ignored
      });

      const missingFields: string[] = [];
      if (!studentData.name) missingFields.push('name');
      if (!studentData.fatherName) missingFields.push('fatherName');
      if (!studentData.studentId) missingFields.push('studentId');
      if (!studentData.className) missingFields.push('className');
      if (!studentData.parentPhone) missingFields.push('parentPhone');

      if (missingFields.length > 0) {
        errors.push(`Row ${i}: Missing required fields: ${missingFields.join(', ')}`);
        continue;
      }

      const classMatch = studentData.className.match(/Class\s*(\d+)/i);
      if (!classMatch || parseInt(classMatch[1]) < 1 || parseInt(classMatch[1]) > 12) {
        errors.push(
          `Row ${i}: Invalid class format. Use number 1-12 (e.g., "9" or "Class 9")`
        );
        continue;
      }

      try {
        const existing = await Student.findOne({
          studentId: studentData.studentId,
        });

        if (existing) {
          errors.push(
            `Row ${i}: Student with ID ${studentData.studentId} already exists`
          );
          continue;
        }

        await Student.create({
          name: studentData.name,
          fatherName: studentData.fatherName,
          studentId: studentData.studentId,
          className: studentData.className,
          parentPhone: studentData.parentPhone,
          address: studentData.address || '',
          rollNo: studentData.rollNo || '',
          isActive: true,
        });

        successCount++;
      } catch (err) {
        errors.push(
          `Row ${i}: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      total: processedCount,
      successCount,
      errorCount: errors.length,
      errors: errors.slice(0, 20),
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}