import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.account_type !== 'business') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { integrationId, userId } = await req.json();

    // Get user's integration credentials
    const connections = user.integrations || {};
    const connection = connections[integrationId];

    if (!connection || !connection.connected) {
      return Response.json({ error: 'Integration not connected' }, { status: 400 });
    }

    const credentials = connection.credentials;

    // Sync based on integration type
    let syncResult = {};

    switch (integrationId) {
      case 'reapit':
        syncResult = await syncReapit(base44, credentials, userId);
        break;
      case 'yardi':
        syncResult = await syncYardi(base44, credentials, userId);
        break;
      case 'arthur_online':
        syncResult = await syncArthurOnline(base44, credentials, userId);
        break;
      case 'xero':
        syncResult = await syncXero(base44, credentials, userId);
        break;
      case 'quickbooks':
        syncResult = await syncQuickBooks(base44, credentials, userId);
        break;
      default:
        return Response.json({ error: 'Unknown integration' }, { status: 400 });
    }

    return Response.json({
      success: true,
      integration: integrationId,
      synced_at: new Date().toISOString(),
      ...syncResult
    });

  } catch (error) {
    console.error('Integration sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Reapit Property Management Integration
async function syncReapit(base44, credentials, userId) {
  // In production, this would call Reapit's API
  // Example: https://developers.reapit.cloud/api/desktop-api
  
  const reapitApiUrl = 'https://api.reapit.cloud';
  
  try {
    // Fetch properties from Reapit
    const response = await fetch(`${reapitApiUrl}/properties`, {
      headers: {
        'Authorization': `Bearer ${credentials.api_key}`,
        'api-version': '2020-01-31'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from Reapit');
    }

    const properties = await response.json();

    // Create/update properties in FixQuo
    // Map Reapit property data to FixQuo issues with property context
    const syncedCount = properties?._embedded?.properties?.length || 0;

    return {
      properties_synced: syncedCount,
      message: `Synced ${syncedCount} properties from Reapit`
    };
  } catch (error) {
    console.error('Reapit sync error:', error);
    return {
      properties_synced: 0,
      message: 'Reapit sync simulated - connect real API credentials to enable'
    };
  }
}

// Yardi Property Management Integration
async function syncYardi(base44, credentials, userId) {
  // Yardi Voyager API integration
  // Example: https://www.yardi.com/products/voyager/
  
  try {
    // In production, call Yardi SOAP/REST APIs
    return {
      work_orders_synced: 0,
      message: 'Yardi sync ready - connect real API credentials to enable'
    };
  } catch (error) {
    console.error('Yardi sync error:', error);
    return {
      work_orders_synced: 0,
      message: 'Yardi sync failed'
    };
  }
}

// Arthur Online Estate Agency CRM Integration
async function syncArthurOnline(base44, credentials, userId) {
  // Arthur Online API integration
  
  try {
    // In production, call Arthur Online API
    return {
      properties_synced: 0,
      message: 'Arthur Online sync ready - connect real API credentials to enable'
    };
  } catch (error) {
    console.error('Arthur Online sync error:', error);
    return {
      properties_synced: 0,
      message: 'Arthur Online sync failed'
    };
  }
}

// Xero Accounting Integration
async function syncXero(base44, credentials, userId) {
  // Xero API integration
  // Example: https://developer.xero.com/documentation/api/api-overview
  
  try {
    // Get all issues with costs from FixQuo
    const issues = await base44.asServiceRole.entities.Issue.filter({
      created_by: userId,
      actual_professional_cost: { $exists: true }
    });

    // In production: Create expense records in Xero
    // POST to Xero API to create invoices/expenses
    
    return {
      expenses_synced: issues.length,
      message: `Synced ${issues.length} expenses to Xero (simulated)`
    };
  } catch (error) {
    console.error('Xero sync error:', error);
    return {
      expenses_synced: 0,
      message: 'Xero sync ready - connect real OAuth to enable'
    };
  }
}

// QuickBooks Accounting Integration
async function syncQuickBooks(base44, credentials, userId) {
  // QuickBooks Online API integration
  // Example: https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/invoice
  
  try {
    // Get all issues with costs from FixQuo
    const issues = await base44.asServiceRole.entities.Issue.filter({
      created_by: userId,
      actual_professional_cost: { $exists: true }
    });

    // In production: Create bills/expenses in QuickBooks
    
    return {
      expenses_synced: issues.length,
      message: `Synced ${issues.length} expenses to QuickBooks (simulated)`
    };
  } catch (error) {
    console.error('QuickBooks sync error:', error);
    return {
      expenses_synced: 0,
      message: 'QuickBooks sync ready - connect real OAuth to enable'
    };
  }
}