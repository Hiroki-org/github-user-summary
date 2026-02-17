from playwright.sync_api import sync_playwright

def verify_card():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})

        print("Navigating to user page...")
        # torvalds のページへ
        page.goto("http://localhost:3000/torvalds")

        # ページ読み込み待機 (最大30秒)
        try:
            page.wait_for_selector("text=GitHub User Summary", timeout=10000)
            print("Page title found.")
        except Exception as e:
            print(f"Timeout waiting for page load: {e}")
            page.screenshot(path="verification/verification_error_load.png")
            return

        # エラーが表示されていないか確認
        try:
            if page.locator(".text-danger").count() > 0:
                print("Error found on page")
                print(page.locator(".text-danger").first.inner_text())
                page.screenshot(path="verification/verification_error.png")
                # エラーでもUIの配置が見れるなら進むが、summaryがないとボタンが出ない
                # ボタンがあるか確認
                if page.locator("button:has-text('Card')").count() == 0:
                    print("Card button not found due to error")
                    return
        except Exception as e:
            print(f"Error checking for errors: {e}")

        print("Checking for Card button...")
        # ボタンを探す
        try:
            card_btn = page.locator("button:has-text('Card')").first
            if card_btn.count() > 0:
                print("Card button found. Clicking...")
                card_btn.click()

                print("Waiting for modal...")
                # モーダルが表示されるのを待つ
                page.wait_for_selector("text=Profile Card", timeout=5000)

                print("Waiting for preview generation...")
                # プレビュー画像が表示されるのを待つ (imgタグ)
                # ローディング中は "Generating preview..."
                # 生成されると img タグが出る
                try:
                    page.wait_for_selector("img[alt='Card Preview']", timeout=15000)
                    print("Preview generated.")
                except Exception as e:
                    print(f"Preview generation timed out: {e}")

                # スクリーンショット撮影
                page.wait_for_timeout(2000) # 念のため少し待つ
                page.screenshot(path="verification/verification_card.png")
                print("Screenshot saved to verification/verification_card.png")
            else:
                print("Card button not found.")
                page.screenshot(path="verification/verification_no_button.png")
        except Exception as e:
            print(f"Error interacting with card button: {e}")
            page.screenshot(path="verification/verification_error_click.png")

        browser.close()

if __name__ == "__main__":
    verify_card()
