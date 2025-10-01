import { projectId, publicAnonKey } from '../supabase/info';

// Mock authentication system that works with our KV store backend
class MockAuthClient {
  private user = null;
  private listeners = new Set();

  constructor() {
    // Check for existing session on initialization
    this.checkExistingSession();
  }

  private checkExistingSession() {
    const userData = localStorage.getItem('astronots_user');
    const sessionToken = localStorage.getItem('astronots_session');
    
    if (userData && sessionToken) {
      try {
        this.user = JSON.parse(userData);
        // Notify listeners about existing session
        setTimeout(() => this.notifyListeners('SIGNED_IN', { user: this.user }), 0);
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('astronots_user');
        localStorage.removeItem('astronots_session');
      }
    }
  }

  async signUp(email, password, name, userType) {
    try {
      // First try server authentication
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-0a8c168d/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          email,
          password,
          name,
          userType
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        console.error('Server signup failed:', errorData.error);
        
        // Fallback to local signup
        return this.fallbackSignUp(email, password, name, userType);
      }

      const data = await response.json();
      
      // Store user data and session
      this.user = data.user;
      localStorage.setItem('astronots_user', JSON.stringify(data.user));
      localStorage.setItem('astronots_session', data.session.access_token);
      
      this.notifyListeners('SIGNED_IN', { user: this.user });
      
      return { data: { user: this.user }, error: null };
    } catch (error) {
      console.error('SignUp error:', error);
      // Fallback to local signup
      return this.fallbackSignUp(email, password, name, userType);
    }
  }

  // Fallback local signup
  fallbackSignUp(email, password, name, userType) {
    // Basic validation
    if (!email || !password || !name) {
      return { 
        data: null, 
        error: new Error('Missing required fields: email, password, and name are required') 
      };
    }

    if (password.length < 6) {
      return { 
        data: null, 
        error: new Error('Password must be at least 6 characters long') 
      };
    }

    // Check if it's a demo account (prevent overwrite)
    const userEmail = email.trim().toLowerCase();
    const demoEmails = [
      'demo@astronots.space',
      'scientist@astronots.space', 
      'investor@astronots.space',
      'architect@astronots.space'
    ];

    if (demoEmails.includes(userEmail)) {
      return { 
        data: null, 
        error: new Error('This email is reserved for demo accounts. Please use the demo login instead.') 
      };
    }

    // Create new user locally
    const newUser = {
      id: `fallback_user_${Date.now()}`,
      email: userEmail,
      name: name.trim(),
      userType: userType || 'scientist'
    };

    // Store user data locally
    const existingUsers = JSON.parse(localStorage.getItem('astronots_local_users') || '{}');
    existingUsers[userEmail] = {
      ...newUser,
      password, // In a real app, this would be hashed
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('astronots_local_users', JSON.stringify(existingUsers));

    // Store current session
    this.user = newUser;
    localStorage.setItem('astronots_user', JSON.stringify(newUser));
    localStorage.setItem('astronots_session', `fallback_token_${newUser.id}`);
    
    this.notifyListeners('SIGNED_IN', { user: this.user });
    
    console.log('Fallback signup successful for:', userEmail);
    
    return { data: { user: this.user }, error: null };
  }

  async signIn(email, password) {
    try {
      // First try server authentication
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-0a8c168d/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        console.error('Server signin failed:', errorData.error);
        
        // Fallback to local authentication for demo accounts
        return this.fallbackSignIn(email, password);
      }

      const data = await response.json();
      
      // Store user data and session
      this.user = data.user;
      localStorage.setItem('astronots_user', JSON.stringify(data.user));
      localStorage.setItem('astronots_session', data.session.access_token);
      
      this.notifyListeners('SIGNED_IN', { user: this.user });
      
      return { data: { user: this.user }, error: null };
    } catch (error) {
      console.error('SignIn error:', error);
      // Fallback to local authentication
      return this.fallbackSignIn(email, password);
    }
  }

  // Fallback local authentication for demo accounts
  fallbackSignIn(email, password) {
    const demoAccounts = {
      'demo@astronots.space': {
        password: 'demo123',
        user: {
          id: 'demo_user_001',
          email: 'demo@astronots.space',
          name: 'Demo User',
          userType: 'scientist'
        }
      },
      'scientist@astronots.space': {
        password: 'science123',
        user: {
          id: 'demo_user_002',
          email: 'scientist@astronots.space',
          name: 'Dr. Sarah Chen',
          userType: 'scientist'
        }
      },
      'investor@astronots.space': {
        password: 'invest123',
        user: {
          id: 'demo_user_003',
          email: 'investor@astronots.space',
          name: 'Mike Johnson',
          userType: 'investor'
        }
      },
      'architect@astronots.space': {
        password: 'mission123',
        user: {
          id: 'demo_user_004',
          email: 'architect@astronots.space',
          name: 'Emma Rodriguez',
          userType: 'mission-architect'
        }
      }
    };

    const userEmail = email.trim().toLowerCase();
    const account = demoAccounts[userEmail];

    if (!account || account.password !== password) {
      return { 
        data: null, 
        error: new Error('Invalid email or password. Please check your credentials or create an account.') 
      };
    }

    // Store user data and session
    this.user = account.user;
    localStorage.setItem('astronots_user', JSON.stringify(account.user));
    localStorage.setItem('astronots_session', `fallback_token_${account.user.id}`);
    
    this.notifyListeners('SIGNED_IN', { user: this.user });
    
    console.log('Fallback authentication successful for:', userEmail);
    
    return { data: { user: this.user }, error: null };
  }

  async signOut() {
    this.user = null;
    localStorage.removeItem('astronots_user');
    localStorage.removeItem('astronots_session');
    
    this.notifyListeners('SIGNED_OUT', { user: null });
    
    return { error: null };
  }

  getSession() {
    return {
      data: {
        session: this.user ? {
          user: this.user,
          access_token: localStorage.getItem('astronots_session')
        } : null
      },
      error: null
    };
  }

  onAuthStateChange(callback) {
    this.listeners.add(callback);
    
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners.delete(callback);
          }
        }
      }
    };
  }

  private notifyListeners(event, session) {
    this.listeners.forEach(callback => {
      callback(event, session);
    });
  }
}

export const mockAuth = new MockAuthClient();