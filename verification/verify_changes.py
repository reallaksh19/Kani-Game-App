import time
from playwright.sync_api import sync_playwright

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        print("Navigating to App...")
        page.goto("http://localhost:3000/Kani-Game-App/")
        page.wait_for_load_state("networkidle")

        # --- SETTINGS ---
        print("Opening Settings...")
        try:
            settings_btn = page.locator('button[aria-label="Settings"]')
            if not settings_btn.is_visible():
                 settings_btn = page.locator('button:has-text("⚙️")')
            settings_btn.click()

            # Unlock parent gate if needed
            page.wait_for_timeout(1000)
            if page.is_visible('input[type="password"]'):
                page.fill('input[type="password"]', 'Superdad')
                page.click('button:has-text("Unlock")')
                page.wait_for_timeout(1000)

            # Scroll down
            page.mouse.wheel(0, 500)
            page.wait_for_timeout(500)

            # Ensure Surprise Mode is OFF
            print("Checking Surprise Mode...")

            row = page.locator('div.flex.items-center.justify-between.py-2', has_text="Surprise Mode").last

            needs_save = False
            if not page.is_visible('text=Enable/Disable Games'):
                print("Surprise Mode seems ON. Toggling off...")
                toggle = row.locator('label')
                toggle.click()
                needs_save = True
                page.wait_for_timeout(500)

            if page.is_visible('text=Enable/Disable Games'):
                print("SUCCESS: Enable/Disable Games section is visible.")

            if needs_save:
                print("Saving settings...")
                page.click('button:has-text("💾 Save")')
                page.wait_for_timeout(3000)
            else:
                print("No changes needed, going back...")
                page.click('button[aria-label="Back"]')
                page.wait_for_timeout(1000)

        except Exception as e:
            print(f"Settings verification failed: {e}")
            page.screenshot(path="verification/error_settings.png")
            page.goto("http://localhost:3000/Kani-Game-App/")

        # Helper to play a game
        def verify_game(name, screenshot_path):
            print(f"Verifying {name}...")
            # Always go home first to reset state
            page.goto("http://localhost:3000/Kani-Game-App/")
            page.wait_for_timeout(1000)

            print("Entering Math Category...")
            try:
                page.click('text=Math', timeout=5000)
                page.wait_for_timeout(1000)
            except:
                print("Could not enter Math category")
                return False

            try:
                # Find the game card.
                page.click(f'text="{name}"', timeout=5000)

                # Difficulty selection (if present)
                try:
                    if page.is_visible('button:has-text("Easy")'):
                        page.click('button:has-text("Easy")')
                except:
                    pass

                # Check for empty questions
                if page.is_visible('text=No Questions Available'):
                     print(f"FAILURE: {name} has 0 questions.")
                     page.screenshot(path=f"verification/error_{name.replace(' ', '_')}_empty.png")
                     return False

                # Start Game
                page.click('button:has-text("START GAME")', timeout=5000)
                page.wait_for_timeout(2000) # Wait for animation/render

                page.screenshot(path=screenshot_path)
                print(f"Captured {screenshot_path}")

                return True
            except Exception as e:
                print(f"Failed {name}: {e}")
                page.screenshot(path=f"verification/error_{name.replace(' ', '_')}.png")
                return False

        verify_game("Fraction Frenzy", "verification/03_fraction.png")
        verify_game("Money Master", "verification/04_money.png")
        verify_game("Geometry Galaxy", "verification/05_geometry.png")

        browser.close()

if __name__ == "__main__":
    verify_changes()
