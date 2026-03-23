import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Service-role call to check all issues
    const allIssues = await base44.asServiceRole.entities.Issue.list();
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 45);
    
    let deletedCount = 0;
    
    for (const issue of allIssues) {
      const createdDate = new Date(issue.created_date);
      
      // Delete if older than 45 days
      if (createdDate < thirtyDaysAgo) {
        await base44.asServiceRole.entities.Issue.delete(issue.id);
        deletedCount++;
      }
    }
    
    return Response.json({
      success: true,
      deletedCount,
      message: `Cleaned up ${deletedCount} issues older than 45 days`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});