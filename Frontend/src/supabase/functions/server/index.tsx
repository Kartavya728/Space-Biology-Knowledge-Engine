import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Initialize Supabase client for server operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Create demo users on startup
async function createDemoUsers() {
  const demoUsers = [
    {
      email: 'demo@astronots.space',
      password: 'demo123',
      name: 'Demo User',
      userType: 'scientist',
      id: 'demo_user_001'
    },
    {
      email: 'scientist@astronots.space',
      password: 'science123',
      name: 'Dr. Sarah Chen',
      userType: 'scientist',
      id: 'demo_user_002'
    },
    {
      email: 'investor@astronots.space',
      password: 'invest123',
      name: 'Mike Johnson',
      userType: 'investor',
      id: 'demo_user_003'
    },
    {
      email: 'architect@astronots.space',
      password: 'mission123',
      name: 'Emma Rodriguez',
      userType: 'mission-architect',
      id: 'demo_user_004'
    }
  ];

  console.log('Starting demo users creation...');
  
  try {
    for (const user of demoUsers) {
      const userKey = `user_${user.email}`;
      
      try {
        const userData = {
          ...user,
          createdAt: new Date().toISOString()
        };
        
        // Always set the demo users (overwrite if exists)
        await kv.set(userKey, userData);
        console.log(`Demo user set: ${user.email} with key: ${userKey}`);
        
        // Verify it was set
        const verification = await kv.get(userKey);
        console.log(`Verification for ${user.email}:`, verification ? 'SUCCESS' : 'FAILED');
        
      } catch (userError) {
        console.error(`Error creating user ${user.email}:`, userError);
      }
    }
    
    // Final verification
    const allUsers = await kv.getByPrefix("user_");
    console.log(`Demo users initialization complete. Total users: ${allUsers.length}`);
    console.log('User emails:', allUsers.map(u => u.email));
    
  } catch (error) {
    console.error('Demo users creation error:', error);
  }
}

// Initialize demo users
createDemoUsers();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-0a8c168d/health", (c) => {
  return c.json({ status: "ok" });
});

// Debug endpoint to check users
app.get("/make-server-0a8c168d/debug-users", async (c) => {
  try {
    const users = await kv.getByPrefix("user_");
    return c.json({ 
      status: "ok", 
      userCount: users.length,
      users: users.map(user => ({ email: user.email, userType: user.userType, id: user.id }))
    });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Sign up endpoint - Mock authentication using KV store
app.post("/make-server-0a8c168d/signup", async (c) => {
  try {
    const { email, password, name, userType } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: "Missing required fields: email, password, and name are required" }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: "Password must be at least 6 characters long" }, 400);
    }

    const userEmail = email.trim().toLowerCase();
    const userKey = `user_${userEmail}`;

    // Check if user already exists
    const existingUser = await kv.get(userKey);
    if (existingUser) {
      return c.json({ error: "An account with this email already exists. Please sign in instead." }, 400);
    }

    // Create user in KV store
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userData = {
      id: userId,
      email: userEmail,
      password: password, // In production, this should be hashed
      name: name.trim(),
      userType: userType || 'scientist',
      createdAt: new Date().toISOString()
    };

    await kv.set(userKey, userData);

    console.log('User created successfully:', userEmail);
    
    // Return user data without password
    const { password: _, ...userResponse } = userData;
    return c.json({ 
      user: userResponse, 
      message: "Account created successfully!",
      session: {
        access_token: `mock_token_${userId}`,
        user: userResponse
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: "Internal server error during signup. Please try again." }, 500);
  }
});

// Sign in endpoint - Mock authentication
app.post("/make-server-0a8c168d/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();

    console.log('Sign in attempt:', { email, passwordLength: password?.length });

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const userEmail = email.trim().toLowerCase();
    const userKey = `user_${userEmail}`;

    console.log('Looking for user with key:', userKey);

    // Check if user exists
    const userData = await kv.get(userKey);
    console.log('User data found:', userData ? 'Yes' : 'No');
    
    if (!userData) {
      // Try to list all users for debugging
      const allUsers = await kv.getByPrefix("user_");
      console.log('All users in KV:', allUsers.map(u => u.email));
      return c.json({ error: "Invalid email or password. Please check your credentials or create an account." }, 400);
    }

    // Check password (in production, use proper password hashing)
    console.log('Password check:', { provided: password, stored: userData.password, match: userData.password === password });
    if (userData.password !== password) {
      return c.json({ error: "Invalid email or password. Please check your credentials or create an account." }, 400);
    }

    console.log('User signed in successfully:', userEmail);
    
    // Return user data without password
    const { password: _, ...userResponse } = userData;
    return c.json({ 
      user: userResponse,
      session: {
        access_token: `mock_token_${userData.id}`,
        user: userResponse
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    return c.json({ error: "Internal server error during signin. Please try again." }, 500);
  }
});

// AI Analysis endpoint
app.post("/make-server-0a8c168d/analyze", async (c) => {
  try {
    const { query, userType, analyst } = await c.req.json();

    if (!query) {
      return c.json({ error: "Query is required" }, 400);
    }

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock AI response based on user type and query
    const response = generateMockAIResponse(query, userType, analyst);

    // Store analysis in KV store for history
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await kv.set(analysisId, {
      query,
      userType,
      analyst,
      response,
      timestamp: new Date().toISOString()
    });

    return c.json({
      analysisId,
      ...response
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return c.json({ error: "Failed to analyze content" }, 500);
  }
});

// Chat endpoint for the chatbot
app.post("/make-server-0a8c168d/chat", async (c) => {
  try {
    const { message, context } = await c.req.json();

    if (!message) {
      return c.json({ error: "Message is required" }, 400);
    }

    // Simulate AI chat processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    const chatResponse = generateChatResponse(message, context);

    return c.json({
      response: chatResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat error:', error);
    return c.json({ error: "Failed to process chat message" }, 500);
  }
});

// Get analysis history
app.get("/make-server-0a8c168d/history", async (c) => {
  try {
    // Get recent analyses from KV store
    const analyses = await kv.getByPrefix("analysis_");
    
    // Sort by timestamp and limit to 20 most recent
    const sortedAnalyses = analyses
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    return c.json({ analyses: sortedAnalyses });
  } catch (error) {
    console.error('History error:', error);
    return c.json({ error: "Failed to get analysis history" }, 500);
  }
});

// Helper function to generate mock AI responses
function generateMockAIResponse(query: string, userType: string, analyst: any) {
  const baseResponse = {
    summary: `AI analysis of your query: "${query.substring(0, 100)}..." has been completed.`,
    confidence: 0.85 + Math.random() * 0.1,
    processed: true,
    userType,
    analyst
  };

  // Customize response based on user type
  switch (userType) {
    case 'scientist':
      return {
        ...baseResponse,
        focus: 'scientific_methodology',
        insights: [
          'Research methodology demonstrates statistical significance (p < 0.05)',
          'Sample size of 200+ subjects provides robust data foundation',
          'Control group comparisons show clear differential outcomes',
          'Potential for hypothesis generation in related research areas'
        ],
        recommendations: [
          'Consider replication studies with larger sample sizes',
          'Explore additional variables that may influence outcomes',
          'Investigate long-term effects through longitudinal studies'
        ]
      };
    
    case 'investor':
      return {
        ...baseResponse,
        focus: 'commercial_applications',
        insights: [
          'Market potential estimated at $2.3B in space technology sector',
          'ROI projections show 15-25% annual returns over 5-year period',
          'Competitive advantage in emerging space economy applications',
          'Intellectual property opportunities for licensing and partnerships'
        ],
        recommendations: [
          'Pursue patent applications for key innovations',
          'Establish partnerships with aerospace companies',
          'Consider government contract opportunities'
        ]
      };
    
    case 'mission-architect':
      return {
        ...baseResponse,
        focus: 'mission_planning',
        insights: [
          'Safety protocols show 40% improvement in risk mitigation',
          'System efficiency gains of 15-20% over current standards',
          'Mission duration can be extended by 30% with these findings',
          'Resource requirements reduced by 25% through optimization'
        ],
        recommendations: [
          'Integrate findings into next mission planning cycle',
          'Conduct additional safety validation tests',
          'Update mission architecture documentation'
        ]
      };
    
    default:
      return baseResponse;
  }
}

// Helper function to generate chat responses
function generateChatResponse(message: string, context: any) {
  const responses = [
    "That's a great question! Based on the research analysis, I can help clarify that concept for you.",
    "Let me break down that information in a more digestible way.",
    "From the data we've analyzed, here's what's most relevant to your question.",
    "That relates to some key findings in the research. Let me explain the connection.",
    "I can provide more context about that aspect of the study."
  ];

  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  if (message.toLowerCase().includes('methodology')) {
    return `${randomResponse} The research methodology employed rigorous scientific standards with proper control groups and statistical analysis. The peer review process ensures the findings are credible and reproducible.`;
  } else if (message.toLowerCase().includes('commercial') || message.toLowerCase().includes('investment')) {
    return `${randomResponse} The commercial applications of this research are particularly promising, with potential market opportunities in the aerospace and space technology sectors. The ROI analysis shows strong potential for early investors.`;
  } else if (message.toLowerCase().includes('mission') || message.toLowerCase().includes('safety')) {
    return `${randomResponse} From a mission planning perspective, these findings offer significant improvements in safety protocols and operational efficiency. The data supports implementation in future space missions.`;
  } else {
    return `${randomResponse} The research provides valuable insights that can be applied across multiple domains. Would you like me to elaborate on any specific aspect of the findings?`;
  }
}

Deno.serve(app.fetch);