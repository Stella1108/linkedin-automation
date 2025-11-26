const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const { execSync } = require('child_process');

// Use stealth plugin properly
puppeteer.use(StealthPlugin());

export interface ConnectionResult {
  success: boolean;
  message?: string;
  error?: string;
}

export class LinkedInConnector {
  private browser: any = null;
  private page: any = null;

  async init(): Promise<boolean> {
    try {
      console.log('🚀 Initializing LinkedIn Connector...');
      
      const executablePath = await this.findChromePath();
      
      if (!executablePath) {
        throw new Error('Google Chrome not found.');
      }

      console.log('✅ Using Chrome at:', executablePath);

      const launchOptions = {
        headless: false,
        executablePath: executablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
          '--window-size=1200,800',
          '--position=100,100',
          `--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`
        ],
        ignoreHTTPSErrors: true,
        ignoreDefaultArgs: ['--enable-automation']
      };

      this.browser = await puppeteer.launch(launchOptions);
      this.page = await this.browser.newPage();
      
      // Set up page
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await this.page.setViewport({ width: 1200, height: 800 });
      
      this.page.setDefaultNavigationTimeout(120000);
      this.page.setDefaultTimeout(60000);
      
      console.log('✅ LinkedIn Connector initialized successfully');
      return true;
      
    } catch (error: any) {
      console.error('❌ Failed to initialize connector:', error.message);
      return false;
    }
  }

  private async findChromePath(): Promise<string | null> {
    const possiblePaths = [
      process.env.CHROMIUM_PATH,
      process.env.CHROME_PATH,
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium'
    ];

    for (const path of possiblePaths) {
      if (path && fs.existsSync(path)) {
        return path;
      }
    }

    try {
      if (process.platform === 'win32') {
        const result = execSync('where chrome', { stdio: 'pipe' }).toString().trim();
        if (result) return result.split('\n')[0];
      } else {
        const result = execSync('which google-chrome || which chromium-browser || which chromium', { stdio: 'pipe' }).toString().trim();
        if (result) return result;
      }
    } catch (error) {
      // Ignore command errors
    }

    return null;
  }

  // Manual login flow without scraping
  async startManualLoginFlow(userData: { fullName: string; email: string; location: string }): Promise<ConnectionResult> {
    try {
      console.log('🔐 Starting manual LinkedIn login flow for:', userData.email);
      
      if (!this.browser) {
        const initialized = await this.init();
        if (!initialized) {
          return { 
            success: false, 
            error: 'Failed to initialize browser.' 
          };
        }
      }

      // Navigate to LinkedIn login
      await this.page.goto('https://www.linkedin.com/login', { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });

      // Show instruction message to user
      await this.showInstructions();

      console.log('⏳ Waiting for user to manually login...');

      // Wait for user to manually login
      const loginSuccess = await this.waitForManualLogin();
      
      if (!loginSuccess) {
        await this.close();
        return { 
          success: false, 
          error: 'Manual login failed or timed out. Please try again.' 
        };
      }

      console.log('✅ User successfully logged in to LinkedIn!');
      
      // Give it more time to stabilize and verify login properly
      console.log('⏳ Waiting for page to stabilize after login...');
      await this.page.waitForTimeout(8000);
      
      // Verify login with multiple checks
      console.log('🔍 Verifying login status...');
      const verified = await this.verifyLogin();
      
      if (verified) {
        console.log('✅ LinkedIn login verified successfully!');
        await this.close();
        return {
          success: true,
          message: 'LinkedIn account connected successfully!'
        };
      } else {
        console.log('❌ Failed to verify LinkedIn login');
        await this.close();
        return {
          success: false,
          error: 'Failed to verify LinkedIn login. Please try again.'
        };
      }
      
    } catch (error: any) {
      console.error('❌ Manual login process error:', error.message);
      await this.close();
      return { 
        success: false, 
        error: `Connection failed: ${error.message}` 
      };
    }
  }

  private async showInstructions(): Promise<void> {
    // Add instructions to the page
    await this.page.evaluate(() => {
      const instructionDiv = document.createElement('div');
      instructionDiv.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 14px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 400px;
      `;
      instructionDiv.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">🔗 Connect LinkedIn Account</div>
        <div style="font-size: 12px;">
          1. Login to your LinkedIn account<br>
          2. After successful login, this window will close automatically<br>
          3. Your account will be connected to the system
        </div>
      `;
      document.body.appendChild(instructionDiv);
    });
  }

  // Wait for manual login without scraping data
  private async waitForManualLogin(): Promise<boolean> {
    console.log('🔍 Monitoring for manual login...');
    
    const maxWaitTime = 300000; // 5 minutes
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const currentUrl = this.page.url();
        console.log('📄 Current URL:', currentUrl);
        
        // Check for successful login indicators
        const isLoggedIn = 
          currentUrl.includes('/feed') || 
          currentUrl.includes('/in/') || 
          currentUrl === 'https://www.linkedin.com/' ||
          currentUrl.includes('linkedin.com/feed/') ||
          currentUrl.includes('linkedin.com/mynetwork/') ||
          currentUrl.includes('linkedin.com/jobs/') ||
          currentUrl.includes('linkedin.com/messaging/') ||
          await this.isUserLoggedIn();
        
        if (isLoggedIn) {
          console.log('✅ Login detected!');
          // Wait a bit more to ensure the page is fully loaded
          await this.page.waitForTimeout(5000);
          return true;
        }
        
        // Check if user is still on login page
        if (currentUrl.includes('login') || await this.page.$('#username') !== null) {
          console.log('⏳ Still on login page, waiting for user to login...');
        } else {
          console.log('🔄 User navigated away from login page, checking login status...');
        }
        
        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.log('⚠️ Error checking login status:', error);
        // Continue waiting despite errors
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log('❌ Login timeout reached');
    return false;
  }

  private async isUserLoggedIn(): Promise<boolean> {
    try {
      // Check for elements that indicate user is logged in
      const loggedInSelectors = [
        'input[role="combobox"]', // Search box
        '.global-nav__me', // Profile menu
        '.scaffold-layout__sidebar', // Main layout
        '.feed-identity-module__actor-meta', // Feed identity
        'nav.global-nav', // Main navigation
        '.global-nav__primary-item', // Navigation items
        'button[data-control-name="nav.settings_icon"]', // Settings icon
        '.search-global-typeahead__input', // Search input
        '.global-nav__branding', // LinkedIn logo
        'img[data-test-global-nav-logo]', // LinkedIn logo
        '.scaffold-layout__main', // Main content area
        'div[data-test-global-nav-header]' // Global nav header
      ];
      
      for (const selector of loggedInSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element !== null) {
            console.log(`✅ Found logged-in indicator: ${selector}`);
            return true;
          }
        } catch (error) {
          // Continue checking other selectors
        }
      }
      
      // Also check if we can see the user's profile menu
      try {
        const profileMenu = await this.page.$('.global-nav__me-photo, .global-nav__primary-link-me');
        if (profileMenu !== null) {
          console.log('✅ Found profile menu - user is logged in');
          return true;
        }
      } catch (error) {
        // Ignore error
      }
      
      return false;
    } catch (error) {
      console.log('Error checking login elements:', error);
      return false;
    }
  }

  private async verifyLogin(): Promise<boolean> {
    try {
      console.log('🔍 Verifying LinkedIn login with multiple checks...');
      
      // Multiple verification checks with better timing
      const checks = [
        this.verifyByUrl(),
        this.verifyByUIElements(),
        this.verifyByNavigation()
      ];
      
      const results = await Promise.all(checks);
      const verified = results.filter(result => result === true).length >= 2;
      
      console.log(`✅ Login verification result: ${verified} (${results.filter(r => r).length}/3 checks passed)`);
      return verified;
      
    } catch (error) {
      console.error('Error verifying login:', error);
      return false;
    }
  }

  private async verifyByUrl(): Promise<boolean> {
    try {
      const currentUrl = this.page.url();
      const isLoggedInUrl = 
        currentUrl.includes('/feed') || 
        currentUrl.includes('linkedin.com/feed/') ||
        currentUrl === 'https://www.linkedin.com/' ||
        currentUrl.includes('linkedin.com/mynetwork/') ||
        currentUrl.includes('linkedin.com/jobs/') ||
        currentUrl.includes('linkedin.com/messaging/') ||
        (currentUrl.includes('linkedin.com') && !currentUrl.includes('login'));
      
      console.log(`🔗 URL verification: ${isLoggedInUrl} (${currentUrl})`);
      return isLoggedInUrl;
    } catch (error) {
      return false;
    }
  }

  private async verifyByUIElements(): Promise<boolean> {
    try {
      const isLoggedIn = await this.isUserLoggedIn();
      console.log(`🎯 UI Elements verification: ${isLoggedIn}`);
      return isLoggedIn;
    } catch (error) {
      return false;
    }
  }

  private async verifyByNavigation(): Promise<boolean> {
    try {
      // Try to navigate to a protected page to verify login
      console.log('🧭 Testing navigation to feed...');
      await this.page.goto('https://www.linkedin.com/feed/', { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      const currentUrl = this.page.url();
      const canAccessFeed = currentUrl.includes('/feed') || currentUrl.includes('linkedin.com/feed/');
      
      console.log(`🧭 Navigation verification: ${canAccessFeed} (${currentUrl})`);
      return canAccessFeed;
    } catch (error) {
      console.log('Navigation verification failed:', error);
      return false;
    }
  }

  async close() {
    if (this.browser) {
      try {
        // Give a moment before closing to ensure everything is complete
        await this.page.waitForTimeout(2000);
        await this.browser.close();
        console.log('🔚 Browser closed successfully');
      } catch (error) {
        console.error('Error closing browser:', error);
      } finally {
        this.browser = null;
        this.page = null;
      }
    }
  }
}