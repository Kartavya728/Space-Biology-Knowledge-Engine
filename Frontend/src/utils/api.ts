// API service for connecting to the Django backend with SSE support

interface AnalysisRequest {
  query: string;
  userType?: string;
}

interface StreamEvent {
  type: 'thinking' | 'thinking_detail' | 'title' | 'paragraph' | 'metadata' | 'error' | 'done';
  content: any;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const api = {
  /**
   * Stream analysis response using Server-Sent Events
   * Enhanced to handle title, thinking, and paragraph events with low latency
   */
  streamAnalysis: async (
    request: AnalysisRequest,
    onEvent: (event: StreamEvent) => void
  ): Promise<void> => {
    try {
      const url = `${API_BASE_URL}/api/chat/`;
      console.log('Sending request to:', url);
      console.log('Request payload:', request);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Stream completed');
          break;
        }

        // Decode chunk immediately for low latency
        buffer += decoder.decode(value, { stream: true });
        
        // Process all complete messages in buffer
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // Keep incomplete message in buffer

        for (const message of messages) {
          if (message.trim().startsWith('data: ')) {
            const jsonStr = message.replace('data: ', '').trim();
            if (jsonStr) {
              try {
                const event = JSON.parse(jsonStr);
                console.log('Received event:', event.type, event.content ? `(${typeof event.content})` : '');
                
                // Immediately dispatch event for real-time updates
                onEvent(event);
              } catch (e) {
                console.error('Failed to parse SSE message:', jsonStr, e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream analysis error:', error);
      onEvent({
        type: 'error',
        content: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      onEvent({ type: 'done', content: null });
    }
  }
};