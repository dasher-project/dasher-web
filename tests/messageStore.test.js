import MessageStore from '../browser/dasher/messageStore'

describe('Message Store', () => {

  let _msgStore = new MessageStore();

  beforeAll(async () => {
    await page.goto('http://127.0.0.1:8000');
  })

  it('should return basic text', async () => {
    let result = _msgStore.test();
    expect(result).toMatch('messageStore');
  })
})
