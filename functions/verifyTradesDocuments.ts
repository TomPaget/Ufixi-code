import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentUrls, businessName, businessNumber } = await req.json();

    console.log('Starting verification for:', user.id);

    // Step 1: AI-powered document analysis with OCR
    const documentAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are an expert document verification AI specializing in trade certifications, business licenses, and professional credentials.

VERIFICATION TASK:
Analyze the uploaded documents for a tradesperson applying to join our platform.

Business Name: ${businessName || 'Not provided'}
Business Number: ${businessNumber || 'Not provided'}

COMPREHENSIVE ANALYSIS REQUIREMENTS:

1. DOCUMENT TYPE IDENTIFICATION:
   - Identify each document type (business license, Gas Safe cert, NICEIC card, insurance, etc.)
   - Verify it's an official document, not a photocopy or screenshot
   - Check for security features, watermarks, official seals

2. OCR DATA EXTRACTION:
   Extract ALL visible information:
   - License/Certificate numbers
   - Issue and expiry dates
   - License holder name
   - Business registration numbers
   - Issuing authority/body
   - Scope of certification (what they're certified to do)
   - Geographic coverage/limitations

3. VALIDITY CHECKS:
   - Are dates valid and current? (Not expired)
   - Does the name match provided business name?
   - Are license numbers in correct format?
   - Is the issuing authority legitimate?
   - Any red flags (alterations, inconsistencies, etc.)

4. FRAUD DETECTION:
   Look for signs of:
   - Digital manipulation or editing
   - Inconsistent fonts/formatting
   - Mismatched dates or information
   - Poor image quality (suggesting forgery)
   - Missing security features

5. CONFIDENCE SCORING:
   For each document, provide:
   - Authenticity Score (0-100): How confident the document is real
   - Completeness Score (0-100): How much required info is visible
   - Currency Score (0-100): How up-to-date the certifications are

6. OVERALL VERIFICATION:
   - Overall Confidence (0-100): Combined confidence in applicant legitimacy
   - Recommendation: "auto_approve", "manual_review", or "reject"
   - Reasoning: Detailed explanation of decision

SCORING GUIDELINES:
- 90-100: Perfect documentation, auto-approve
- 75-89: Good but needs minor manual verification
- 60-74: Significant concerns, manual review required
- Below 60: Reject or request better documentation

Return structured data with all extracted information.`,
      file_urls: documentUrls,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          documents: {
            type: "array",
            items: {
              type: "object",
              properties: {
                document_type: { type: "string" },
                authenticity_score: { type: "number", minimum: 0, maximum: 100 },
                completeness_score: { type: "number", minimum: 0, maximum: 100 },
                currency_score: { type: "number", minimum: 0, maximum: 100 },
                extracted_data: {
                  type: "object",
                  properties: {
                    license_number: { type: "string" },
                    holder_name: { type: "string" },
                    issue_date: { type: "string" },
                    expiry_date: { type: "string" },
                    issuing_authority: { type: "string" },
                    business_number: { type: "string" }
                  }
                },
                concerns: { type: "array", items: { type: "string" } }
              }
            }
          },
          overall_confidence: { type: "number", minimum: 0, maximum: 100 },
          recommendation: { 
            type: "string",
            enum: ["auto_approve", "manual_review", "reject"]
          },
          reasoning: { type: "string" }
        },
        required: ["documents", "overall_confidence", "recommendation", "reasoning"]
      }
    });

    console.log('Document analysis complete:', documentAnalysis);

    // Step 2: Companies House verification (UK business registration)
    let companiesHouseVerified = false;
    let companiesHouseData = null;

    if (businessNumber && businessNumber.length >= 6) {
      try {
        const companiesHouseCheck = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Search Companies House (UK) for business registration number: ${businessNumber}
          
Business Name: ${businessName}

Verify:
1. Does this company exist in Companies House?
2. Is it active and not dissolved?
3. Does the name match?
4. What is the incorporation date?
5. What is the company status?
6. Any director information?

Return verification results.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              company_exists: { type: "boolean" },
              company_active: { type: "boolean" },
              name_matches: { type: "boolean" },
              incorporation_date: { type: "string" },
              company_status: { type: "string" },
              verification_confidence: { type: "number", minimum: 0, maximum: 100 }
            }
          }
        });

        companiesHouseVerified = companiesHouseCheck.company_exists && 
                                 companiesHouseCheck.company_active;
        companiesHouseData = companiesHouseCheck;
        
        console.log('Companies House verification:', companiesHouseCheck);
      } catch (error) {
        console.log('Companies House check failed (non-critical):', error.message);
      }
    }

    // Step 3: Calculate final confidence and decision
    const finalConfidence = documentAnalysis.overall_confidence;
    let finalDecision = documentAnalysis.recommendation;
    
    // Boost confidence if Companies House verified
    if (companiesHouseVerified) {
      finalDecision = finalConfidence >= 85 ? 'auto_approve' : 'manual_review';
    }

    // Auto-approve if confidence is very high
    const autoApproved = finalDecision === 'auto_approve';

    // Step 4: Update user record with verification results
    await base44.asServiceRole.auth.updateUser(user.id, {
      trades_verification_status: autoApproved ? 'approved' : 'pending',
      trades_verified: autoApproved,
      verification_confidence: finalConfidence,
      verification_data: {
        document_analysis: documentAnalysis,
        companies_house: companiesHouseData,
        verified_at: new Date().toISOString(),
        auto_approved: autoApproved
      }
    });

    console.log('User updated with verification:', autoApproved ? 'APPROVED' : 'PENDING');

    // Step 5: Send notification to user
    const notificationMessage = autoApproved
      ? `Congratulations! Your documents have been automatically verified and your trades account is now active. You can start receiving job requests.`
      : finalDecision === 'manual_review'
      ? `Your documents have been received and are under review. We'll notify you within 24-48 hours.`
      : `We need additional information to verify your account. Please check your dashboard for details.`;

    try {
      await base44.asServiceRole.functions.invoke('sendNotification', {
        userId: user.id,
        title: autoApproved ? "Account Verified ✅" : "Verification In Progress",
        message: notificationMessage,
        type: "general",
        priority: autoApproved ? "high" : "normal",
        actionUrl: autoApproved ? "TradesDashboard" : "TradesPending"
      });
    } catch (error) {
      console.log('Notification send failed (non-critical):', error);
    }

    // Step 6: Send email notification
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: autoApproved ? "QuoFix - Account Verified!" : "QuoFix - Verification Status Update",
        body: `
Hello ${user.full_name},

${notificationMessage}

${autoApproved ? `
Your QuoFix trades account is now fully active!

Next steps:
• Complete your profile with photos and bio
• Set your service area and rates
• Start responding to job requests

Get started: https://quofix.app
` : `
Our team is reviewing your documents. If we need any additional information, we'll reach out to you.

Status: ${finalDecision === 'manual_review' ? 'Under Review' : 'Action Required'}
Confidence Score: ${finalConfidence}%

Check your dashboard: https://quofix.app
`}

Best regards,
The QuoFix Team
        `
      });
    } catch (error) {
      console.log('Email send failed (non-critical):', error);
    }

    return Response.json({
      success: true,
      auto_approved: autoApproved,
      verification_status: autoApproved ? 'approved' : 'pending',
      confidence_score: finalConfidence,
      recommendation: finalDecision,
      reasoning: documentAnalysis.reasoning,
      companies_house_verified: companiesHouseVerified,
      documents_analyzed: documentAnalysis.documents?.length || 0
    });

  } catch (error) {
    console.error('Verification failed:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});