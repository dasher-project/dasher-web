
describe('Dasher', () => {
  beforeAll(async () => {
    await page.goto('http://127.0.0.1:8000')
  })

  it('should display "dasher" text on page', async () => {
    await expect(page).toMatch('dasher')
  })
})
