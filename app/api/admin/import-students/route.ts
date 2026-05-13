import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Student from '@/lib/models/Student';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    console.log('Headers found:', headers);
    
    const results = [];
    const errors = [];
    let successCount = 0;
    
    // Define required fields mapping
    const requiredFields = ['name', 'fathername', 'studentid', 'classname', 'contactemail'];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim());
      const studentData: any = {};
      
      // Map CSV columns to database fields
      headers.forEach((header, idx) => {
        if (header === 'name') studentData.name = values[idx];
        else if (header === 'fathername') studentData.fatherName = values[idx];
        else if (header === 'studentid') studentData.studentId = values[idx];
        else if (header === 'classname') studentData.className = values[idx];
        else if (header === 'contactemail') studentData.contactEmail = values[idx];
        else if (header === 'parentphone') studentData.parentPhone = values[idx];
        else if (header === 'contactphone') studentData.contactPhone = values[idx];
        else if (header === 'address') studentData.address = values[idx];
        else if (header === 'rollno') studentData.rollNo = values[idx];
      });
      
      // Validate required fields
      const missingFields = [];
      if (!studentData.name) missingFields.push('name');
      if (!studentData.fatherName) missingFields.push('fatherName');
      if (!studentData.studentId) missingFields.push('studentId');
      if (!studentData.className) missingFields.push('className');
      if (!studentData.contactEmail) missingFields.push('contactEmail');
      
      if (missingFields.length > 0) {
        errors.push(`Row ${i}: Missing required fields: ${missingFields.join(', ')}`);
        continue;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(studentData.contactEmail)) {
        errors.push(`Row ${i}: Invalid email format: ${studentData.contactEmail}`);
        continue;
      }
      
      try {
        // Check if student already exists
        const existing = await Student.findOne({ 
          $or: [
            { studentId: studentData.studentId },
            { contactEmail: studentData.contactEmail }
          ]
        });
        
        if (existing) {
          errors.push(`Row ${i}: Student with ID ${studentData.studentId} or email ${studentData.contactEmail} already exists`);
          continue;
        }
        
        await Student.create({
          name: studentData.name,
          fatherName: studentData.fatherName,
          studentId: studentData.studentId,
          className: studentData.className,
          contactEmail: studentData.contactEmail,
          parentPhone: studentData.parentPhone || '',
          contactPhone: studentData.contactPhone || '',
          address: studentData.address || '',
          rollNo: studentData.rollNo || '',
          isActive: true,
        });
        
        successCount++;
      } catch (err) {
        errors.push(`Row ${i}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      total: lines.length - 1,
      successCount,
      errorCount: errors.length,
      errors: errors.slice(0, 20),
    });
    
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}