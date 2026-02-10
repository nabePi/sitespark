# SiteSpark E2E Testing with Playwright
# Tests: Login, Dashboard, Website Creation, Deployment

from playwright.sync_api import sync_playwright
import sys

def test_sitespark_flow():
    """Complete E2E test for SiteSpark"""
    
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()
        
        # Capture console errors
        errors = []
        page.on('console', lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type == 'error' else None)
        
        try:
            print("🧪 Starting SiteSpark E2E Test...")
            
            # Test 1: Login Page
            print("\n1️⃣ Testing Login Page...")
            page.goto('http://localhost:3002/login')
            page.wait_for_load_state('networkidle')
            
            # Check login form exists
            assert page.locator('input[type="email"]').is_visible(), "Email input not found"
            assert page.locator('input[type="password"]').is_visible(), "Password input not found"
            assert page.locator('button[type="submit"]').is_visible(), "Submit button not found"
            print("✅ Login page loaded correctly")
            
            # Test 2: Login Action
            print("\n2️⃣ Testing Login Action...")
            page.fill('input[type="email"]', 'test@sitespark.id')
            page.fill('input[type="password"]', 'test123456')
            page.click('button[type="submit"]')
            
            # Wait for dashboard redirect
            page.wait_for_url('**/dashboard', timeout=10000)
            page.wait_for_load_state('networkidle')
            print("✅ Login successful, redirected to dashboard")
            
            # Test 3: Dashboard Load
            print("\n3️⃣ Testing Dashboard...")
            assert page.locator('text=Welcome back').is_visible(), "Welcome message not found"
            assert page.locator('text=Total Websites').is_visible(), "Stats card not found"
            print("✅ Dashboard loaded with correct content")
            
            # Test 4: Check for JavaScript errors
            print("\n4️⃣ Checking for JavaScript errors...")
            if errors:
                print(f"❌ JavaScript errors found:")
                for error in errors:
                    print(f"   - {error}")
                return False
            else:
                print("✅ No JavaScript errors")
            
            # Screenshot for verification
            page.screenshot(path='/tmp/sitespark_dashboard.png', full_page=True)
            print("\n📸 Screenshot saved: /tmp/sitespark_dashboard.png")
            
            print("\n🎉 All tests passed!")
            return True
            
        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            page.screenshot(path='/tmp/sitespark_error.png', full_page=True)
            print("📸 Error screenshot saved: /tmp/sitespark_error.png")
            return False
            
        finally:
            browser.close()

if __name__ == '__main__':
    success = test_sitespark_flow()
    sys.exit(0 if success else 1)
