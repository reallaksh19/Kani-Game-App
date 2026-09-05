from playwright.sync_api import sync_playwright

def verify_exam_extended_harder():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        try:
            print("Navigating to home page...")
            page.goto('http://localhost:3000')

            # Navigate to Exam
            page.wait_for_selector('button:has-text("Exam")').click()
            page.wait_for_selector('text=Fraction Exam').click()

            # Wait for START GAME
            start_btn = page.wait_for_selector('button:has-text("START GAME")', timeout=10000)

            # Check pool size
            # It should say "75 questions loaded"
            loaded_text = page.locator('text=questions loaded').inner_text()
            print(f"Loaded text: {loaded_text}")

            if "75" not in loaded_text:
                print("WARNING: Expected 75 questions loaded, but found different number.")

            start_btn.click()

            # Wait for game interface
            page.wait_for_selector('button:has-text("Next")')

            # Check progress text "1/25" (session size remains 25)
            progress_count = page.locator('text=1/25')

            if progress_count.is_visible():
                print("SUCCESS: Session length is correct (found '1/25').")
            else:
                raise Exception("Did not find '1/25' progress indicator")

            # Take screenshot of a question
            page.screenshot(path="verification/exam_harder_gameplay.png")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/exam_harder_error.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_exam_extended_harder()
