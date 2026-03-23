import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all issues for this user
    const userIssues = await base44.entities.Issue.filter({ created_by: user.email });
    
    // Check if they've reached the 30-scan limit
    if (userIssues.length >= 30) {
      // Delete the oldest issue to make room
      const oldestIssue = userIssues.reduce((oldest, current) => {
        return new Date(current.created_date) < new Date(oldest.created_date) ? current : oldest;
      });
      
      await base44.entities.Issue.delete(oldestIssue.id);
      
      return Response.json({
        canCreate: true,
        message: 'Oldest scan removed to make room for new scan',
        deletedIssueId: oldestIssue.id
      });
    }

    return Response.json({
      canCreate: true,
      count: userIssues.length,
      remaining: 30 - userIssues.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});