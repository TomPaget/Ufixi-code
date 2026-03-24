import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId } = await req.json();

    // Fetch invoice
    const invoices = await base44.asServiceRole.entities.Invoice.filter({ id: invoiceId });
    const invoice = invoices[0];

    if (!invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Generate email content using AI
    const emailContent = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a professional email to send an invoice to a customer.

Invoice Details:
- Invoice Number: ${invoice.invoice_number}
- Total Amount: £${invoice.total_amount.toFixed(2)}
- Due Date: ${new Date(invoice.due_date).toLocaleDateString()}
- Customer Name: ${invoice.customer_name}
- Tradesperson: ${invoice.tradesperson_name}

Create a friendly, professional email that:
1. Thanks the customer for their business
2. Confirms the work completed
3. Provides the invoice details
4. Mentions payment terms
5. Offers to answer any questions

Keep it warm but professional.`,
      response_json_schema: {
        type: "object",
        properties: {
          subject: { type: "string" },
          body: { type: "string" }
        },
        required: ["subject", "body"]
      }
    });

    // Send email
    await base44.integrations.Core.SendEmail({
      from_name: invoice.tradesperson_name,
      to: invoice.customer_email,
      subject: emailContent.subject,
      body: `${emailContent.body}\n\n---\nInvoice Number: ${invoice.invoice_number}\nTotal Amount: £${invoice.total_amount.toFixed(2)}\nDue Date: ${new Date(invoice.due_date).toLocaleDateString()}\n\nTo view your invoice, please log in to your Ufixi account.`
    });

    // Update invoice status
    await base44.asServiceRole.entities.Invoice.update(invoiceId, {
      status: 'sent',
      sent_date: new Date().toISOString()
    });

    return Response.json({ 
      success: true, 
      message: 'Invoice sent successfully'
    });

  } catch (error) {
    console.error('Send invoice failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});