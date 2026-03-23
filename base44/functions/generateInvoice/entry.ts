import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId, templateStyle = 'professional', additionalNotes = '' } = await req.json();

    // Fetch job details
    const jobs = await base44.asServiceRole.entities.Job.filter({ id: jobId });
    const job = jobs[0];

    if (!job) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    // Use AI to generate invoice details and line items
    const invoiceData = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a detailed professional invoice for the following job:

Job Title: ${job.title}
Description: ${job.description}
Trade Type: ${job.trade_type}
Hourly Rate: £${job.hourly_rate || 65}/hour
Estimated Hours: ${job.estimated_hours || 2} hours
Actual Cost: £${job.actual_cost || job.estimated_cost || 0}
Notes from Job: ${job.notes || 'N/A'}
Additional Notes: ${additionalNotes}

Generate:
1. Line items breakdown (labor, materials, any additional costs)
2. Professional payment terms (e.g., "Payment due within 14 days")
3. Brief thank you note for the customer
4. Any relevant notes about the work completed

Make the invoice professional, clear, and detailed. Break down costs logically.`,
      response_json_schema: {
        type: "object",
        properties: {
          line_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                quantity: { type: "number" },
                unit_price: { type: "number" },
                total: { type: "number" }
              }
            }
          },
          payment_terms: { type: "string" },
          notes: { type: "string" }
        },
        required: ["line_items", "payment_terms", "notes"]
      }
    });

    // Calculate totals
    const subtotal = invoiceData.line_items.reduce((sum, item) => sum + item.total, 0);
    const taxRate = 0.2; // 20% VAT
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 14 days payment term

    // Create invoice record
    const invoice = await base44.asServiceRole.entities.Invoice.create({
      invoice_number: invoiceNumber,
      job_id: jobId,
      customer_id: job.customer_id,
      customer_name: job.customer_name,
      customer_email: job.customer_email || '',
      tradesperson_id: job.tradesperson_id,
      tradesperson_name: job.tradesperson_name,
      issue_date: issueDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      line_items: invoiceData.line_items,
      subtotal: subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      currency: 'GBP',
      status: 'draft',
      notes: invoiceData.notes,
      payment_terms: invoiceData.payment_terms,
      template_style: templateStyle
    });

    // Generate PDF
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('INVOICE', 20, 20);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Invoice #: ${invoiceNumber}`, 20, 30);
    doc.text(`Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 20, 36);
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 20, 42);
    
    // From/To
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('From:', 20, 55);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(job.tradesperson_name, 20, 62);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Bill To:', 120, 55);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(job.customer_name, 120, 62);
    
    // Line items table
    let yPos = 85;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Description', 20, yPos);
    doc.text('Qty', 120, yPos);
    doc.text('Rate', 145, yPos);
    doc.text('Amount', 170, yPos);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos + 2, 190, yPos + 2);
    
    yPos += 10;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    invoiceData.line_items.forEach((item) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      const description = doc.splitTextToSize(item.description, 90);
      doc.text(description, 20, yPos);
      doc.text(item.quantity.toString(), 120, yPos);
      doc.text(`£${item.unit_price.toFixed(2)}`, 145, yPos);
      doc.text(`£${item.total.toFixed(2)}`, 170, yPos);
      yPos += description.length * 7 + 3;
    });
    
    // Totals
    yPos += 10;
    doc.line(120, yPos, 190, yPos);
    yPos += 8;
    
    doc.text('Subtotal:', 120, yPos);
    doc.text(`£${subtotal.toFixed(2)}`, 170, yPos);
    yPos += 7;
    
    doc.text(`VAT (${(taxRate * 100).toFixed(0)}%):`, 120, yPos);
    doc.text(`£${taxAmount.toFixed(2)}`, 170, yPos);
    yPos += 7;
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Total:', 120, yPos);
    doc.text(`£${totalAmount.toFixed(2)}`, 170, yPos);
    
    // Notes
    yPos += 15;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.text('Payment Terms:', 20, yPos);
    yPos += 5;
    doc.setFont(undefined, 'normal');
    const termsLines = doc.splitTextToSize(invoiceData.payment_terms, 170);
    doc.text(termsLines, 20, yPos);
    
    yPos += termsLines.length * 5 + 5;
    doc.setFont(undefined, 'bold');
    doc.text('Notes:', 20, yPos);
    yPos += 5;
    doc.setFont(undefined, 'normal');
    const notesLines = doc.splitTextToSize(invoiceData.notes, 170);
    doc.text(notesLines, 20, yPos);
    
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invoice-${invoiceNumber}.pdf`,
        'X-Invoice-Id': invoice.id
      }
    });

  } catch (error) {
    console.error('Invoice generation failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});