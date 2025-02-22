
export async function getContext(query: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate embedding');
    }

    const data = await response.json();
    const embedding = data.data[0].embedding;

    // Use Supabase's vector similarity search
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: matches, error } = await supabase.rpc(
      'match_knowledge_base',
      {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 5
      }
    );

    if (error) throw error;

    return matches.map((match: any) => match.content).join('\n');
  } catch (error) {
    console.error('Error getting context:', error);
    return '';
  }
}
