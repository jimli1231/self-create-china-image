
from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Open the local HTML file
        file_path = f"file://{os.path.abspath('index.html')}"
        page.goto(file_path)

        # Take a screenshot of the initial state
        page.screenshot(path="screenshot_initial.png")
        print("Initial screenshot taken.")

        # Click the scroll wrapper to open it
        page.click('#scrollWrapper')

        # Wait for transition (approx 1s based on CSS usually, but I'll wait a bit)
        page.wait_for_timeout(2000)

        # Take a screenshot of the open state
        page.screenshot(path="screenshot_open.png")
        print("Open state screenshot taken.")

        browser.close()

if __name__ == "__main__":
    run()
