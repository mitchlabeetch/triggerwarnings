
from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 2000}) # Larger viewport

        # Load the landing page from file
        cwd = os.getcwd()
        page.goto(f'file://{cwd}/landing/index.html')

        # Take a full page screenshot
        page.screenshot(path='verification/landing_page_full.png', full_page=True)

        # Take a screenshot of the hero section with typed text (wait for it)
        page.wait_for_timeout(2000) # wait for typing
        page.screenshot(path='verification/landing_page_hero.png', clip={'x':0, 'y':0, 'width':1200, 'height':800})

        browser.close()

if __name__ == '__main__':
    run()
