// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT
//
/*
 *
 *
*/
export default class MessageStore {
    constructor() {
      this._databaseName = 'messageStore5';
      this._databaseVersion = 1;
    }
    //TESTS
    testSaveMesage(message){
      let datetime = new Date();
      let messageData = { msg: message, datetime: datetime};
      this.save_to_browser(messageData,true);
    }
    testLoadMessages(){
      this.load_from_browser().catch(() => {}).then(messages => {
        console.log(messages);
      });
    }

    /*************/
    addMessage(message){
      let datetime = new Date();
      let messageData = { msg: message, datetime: datetime};
      this.save_to_browser(messageData,true);
    }

    viewMessageStore(){
      this.load_from_browser().catch(() => {}).then(messages => {
        console.log(messages);
      });
    }
    editMessageStore(){
      //To do- for now, export file, make changes, import new file.
    }
    importFile(){

    }
    exportToFile(){
      this.load_from_browser().catch(() => {}).then(messages => {
        console.log(messages);
        this._download(JSON.stringify(messages));
      });
    }

    save_to_browser(entry,showResult) {
        this._open_object_store("readwrite").catch(() => {}).then(store => {

            const putRequest = store.add(entry);
            putRequest.onsuccess = event => {
                if (showResult) {
                    this._show_result(
                        "Saved OK.",
                    );
                }
            };
        });
    }

    load_from_browser() { return new Promise((resolve, reject) => {
        let allMessages = [];
        this._open_object_store("readonly").catch(() => {}).then(store =>
          store.openCursor().onsuccess = function(event) {
              let cursor = event.target.result;
              if(cursor) {
                  allMessages.push(cursor.value);
                  console.log(cursor.value);
                  cursor.continue();
              }
              else{
                resolve(allMessages);
              }
          }
        )
      });
    }

    _open_object_store(mode) { return new Promise((resolve, reject) => {
        // Code is inside the Promise constructor but `this` is still the
        // ControlPanelManager instance because we're also inside a lambda.
        if (!window.indexedDB) {
            this._show_result("No database access", window.indexedDB);
            reject(window.indexedDB);
            return;
        }
        const request = window.indexedDB.open(
            this._databaseName, this._databaseVersion);
        request.onerror = event => {
            this._show_result(`Failed to open database`, event.target.error);
            reject(event.target.error);
            return;
        };

        request.onupgradeneeded = event => {
            // Object store has the same name as the database.
            const database = event.target.result;
            let objectStore = database.createObjectStore(this._databaseName,
              { keyPath: "msgID", autoIncrement: true});

            objectStore.createIndex("msg", "msg", { unique: false });
            objectStore.createIndex("datetime", "datetime", { unique: false });
        };

        request.onsuccess = event => {
          const database = event.target.result;
          const transaction = database.transaction(
            [this._databaseName], mode);
          transaction.onerror = event => {
            this._show_result("Transaction failed", event.target.error);
          }
          resolve(transaction.objectStore(this._databaseName));
        };
    });}

  _show_result(outcome, detail){
    console.log(outcome);
    console.log(detail);
  }
  _download(text) {
    let filename = 'dasher.txt';
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
}
