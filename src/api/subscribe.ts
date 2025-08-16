import type { VercelRequest, VercelResponse } from '@vercel/node';
import mailchimp from '@mailchimp/mailchimp_marketing';

mailchimp.setConfig({
  apiKey: 'de5ba33102d063d239d74e2f63154a64-us1',
  server: 'us1',
});

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { email } = request.body;

  if (!email) {
    return response.status(400).json({ error: 'Email is required' });
  }

  try {
    // Test the API key first
    const ping = await mailchimp.ping.get();
    console.log('Mailchimp ping response:', ping);

    // Get lists to find the correct list ID
    const listsResponse = await mailchimp.lists.getAllLists();
    console.log('Lists response:', listsResponse);
    
    // Use a default list ID or try to get from response
    let listId = 'bc5287777f'; // Default fallback
    
    if (listsResponse && 'lists' in listsResponse && Array.isArray(listsResponse.lists) && listsResponse.lists.length > 0) {
      listId = listsResponse.lists[0].id;
      console.log('Available lists:', listsResponse.lists.map((list: any) => ({ id: list.id, name: list.name })));
    }
    
    await mailchimp.lists.addListMember(listId, {
      email_address: email,
      status: 'subscribed',
    });

    return response.status(200).json({ message: 'Successfully subscribed' });
  } catch (error) {
    console.error('Mailchimp error:', error);
    return response.status(500).json({ 
      error: (error as any).message || 'Something went wrong',
      details: (error as any).response?.body || 'No additional details'
    });
  }
}
