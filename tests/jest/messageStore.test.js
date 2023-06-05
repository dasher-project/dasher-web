require("fake-indexeddb/auto");

import MessageStore from '../../browser/dasher/messageStore'

describe('Message Store', () => {

  let _msgStore = new MessageStore();

  it('should return basic text', async () => {
    let result = _msgStore.test();
    expect(result).toMatch('messageStore');
  })
  /*
  it('should save message', async () => {
    _msgStore.addMessage('Test Message 1234');
  })

  it('should return messages', async () => {
    let result = _msgStore.viewMessageStore();
    console.log(result);
  })
  */
})
