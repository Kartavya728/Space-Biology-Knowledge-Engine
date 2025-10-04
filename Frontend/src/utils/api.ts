// API service for connecting to the Django backend with optimized SSE support

interface AnalysisRequest {
  query: string;
  userType?: string;
}

interface StreamEvent {
  type: 'thinking_step' | 'title' | 'paragraph' | 'metadata' | 'document' | 'error' | 'done';
  content: any;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const api = {
  /**
   * Stream analysis response using Server-Sent Events with ZERO artificial delays
   * Optimized for immediate token-by-token streaming with minimal latency
   */
  streamAnalysis: async (
    request: AnalysisRequest,
    onEvent: (event: StreamEvent) => void
  ): Promise<void> => {
    try {
      const url = `${API_BASE_URL}/api/chat/`;
      console.log('[API] Sending request to:', url);
      console.log('[API] Request payload:', request);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(request),
      });

      console.log('[API] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is not readable');
      }

      // Use ReadableStream with optimized chunk processing
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let messageCount = 0;

      console.log('[API] Starting stream processing...');

      while (true) {
        // Read chunks with minimal buffering for instant processing
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('[API] Stream completed. Total messages:', messageCount);
          break;
        }

        // Decode immediately - no delays
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Process all complete messages IMMEDIATELY
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n\n')) !== -1) {
          const message = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 2);

          if (message.trim().startsWith('data: ')) {
            const jsonStr = message.replace('data: ', '').trim();
            
            if (jsonStr) {
              try {
                const event = JSON.parse(jsonStr);
                messageCount++;
                
                // Log only key events to reduce console spam
                if (event.type === 'title' || event.type === 'paragraph' || event.type === 'done') {
                  console.log(`[API] Event ${messageCount}:`, event.type);
                }
                
                // IMMEDIATE dispatch - zero artificial delays
                onEvent(event);
                
                // Use microtask to ensure non-blocking processing
                await Promise.resolve();
                
              } catch (parseError) {
                console.error('[API] Failed to parse SSE message:', jsonStr.slice(0, 100), parseError);
              }
            }
          }
        }
      }

      console.log('[API] Stream processing finished');
      
    } catch (error) {
      console.error('[API] Stream analysis error:', error);
      onEvent({
        type: 'error',
        content: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      onEvent({ type: 'done', content: null });
    }
  },

  /**
   * Legacy non-streaming endpoint (if needed for fallback)
   */
  analyzeQuery: async (request: AnalysisRequest): Promise<any> => {
    const url = `${API_BASE_URL}/api/analyze/`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    return response.json();
  }
};