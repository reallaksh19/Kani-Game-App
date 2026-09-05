import time
from playwright.sync_api import sync_playwright

def verify_story_jammer():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        print("Navigating to App...")
        try:
            page.goto("http://localhost:3000/Kani-Game-App/")
            page.wait_for_load_state("networkidle")

            print("Entering English Category...")
            if page.is_visible('text=English'):
                page.click('text=English')
                page.wait_for_timeout(1000)

            print("Entering Comprehension Sub-Category...")
            if page.is_visible('text=Comprehension'):
                page.click('text=Comprehension')
                page.wait_for_timeout(1000)

            print("Looking for Story Jammer...")
            if page.is_visible('text=Story Jammer'):
                page.click('text=Story Jammer')
            else:
                print("Story Jammer not found.")
                page.screenshot(path="verification/error_not_found.png")
                raise Exception("Story Jammer link not found")

            page.wait_for_timeout(1000)

            # Difficulty
            if page.is_visible('button:has-text("Easy")'):
                page.click('button:has-text("Easy")')

            # Start Game
            print("Starting Game...")
            if page.is_visible('button:has-text("START GAME")'):
                page.click('button:has-text("START GAME")')
            else:
                 print("START GAME button not found")
                 page.screenshot(path="verification/start_game_fail.png")
                 raise Exception("Start Game button not found")

            page.wait_for_timeout(2000)

            # Verify elements
            print("Verifying Game Elements...")
            if page.is_visible('text=Story Passage'):
                print("Verified: Story Passage header is visible.")
            else:
                print("Failed: Story Passage header not visible.")

            page.screenshot(path="verification/story_jammer_verified.png")
            print("Screenshot saved to verification/story_jammer_verified.png")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error_script.png")

        browser.close()

if __name__ == "__main__":
    verify_story_jammer()
