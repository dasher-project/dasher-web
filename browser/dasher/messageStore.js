// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT
//
/*
 *
 *
*/

export default class MessageStore {
    constructor() {
      this._databaseName = 'messageStore';
      this._databaseVersion = 1;
      this._downloadFilename = 'dasher.json';
    }
    //TESTS
    test(){
      this.addMessage('Hi my name is dasher-web.');
      //this._delete_from_browser(17,true);
      //this.importToDatabase();
      return this._databaseName;
    }

    /*********************************************************/
    addMessage(message){
      let datetime = new Date();
      let messageData = { msg: message, datetime: datetime};
      this._save_to_browser(messageData,true);
    }

    viewMessageStore(){
      this._load_from_browser().catch(() => {}).then(messages => {
        //Messages is an array of message objects
        // msg:string,datetime:Date,msgID:string
        //TODO - present these messages in a usable format
        //For now- stringify the data, and attempt to break up
        //so it fits into an alert window
        const output = messages.map(m=>JSON.stringify(m).replace(",","\n"));
        alert(output.join("\n"));
      });
    }

    editMessageStore(){
      //TODO - use the selected msgID to delete the entry
      //use the function _delete_from_browser
    }

    importToDatabase(){
      //Prompt for the file
      this._importFile().catch(() => {}).then(messages => {
        //Open the Database
        this._open_object_store("readwrite").catch(() => {}).then(store => {
          //Clear the database
          const clearRequest = store.clear();
          clearRequest.onsuccess = event => {
            //Add each message in file to the database
            messages.forEach(msg => {
              store.add(msg);
            });
          };
        });
      });
    }

    exportToFile(){
      this._load_from_browser().catch(() => {}).then(messages => {
        this._download(JSON.stringify(messages));
      });
    }
    /*********************************************************/
    _importFile(){return new Promise((resolve, reject) => {
        var input = document.createElement('input');
        input.type = 'file';
        input.onchange = e => {
          var file = e.target.files[0];
          var reader = new FileReader();
          reader.readAsText(file,'UTF-8');
          reader.onload = readerEvent => {
              var content = readerEvent.target.result;
              resolve(JSON.parse(content));
          }
        }
        input.click();
      });
    }

    _save_to_browser(entry,showResult) {
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
    //On success, resolves an array of message objects
    _load_from_browser() { return new Promise((resolve, reject) => {
        let allMessages = [];
        this._open_object_store("readonly").catch(() => {}).then(store =>
          store.openCursor().onsuccess = function(event) {
              let cursor = event.target.result;
              if(cursor) {
                  allMessages.push(cursor.value);
                  cursor.continue();
              }
              else{
                resolve(allMessages);
              }
          }
        )
      });
    }

    _delete_from_browser(msgID,showResult){
      this._open_object_store("readwrite").catch(() => {}).then(store => {

          const deleteRequest = store.delete(msgID);
          deleteRequest.onsuccess = event => {
              if (showResult) {
                  this._show_result(
                      "Saved OK.",
                  );
              }
          };
      });
    }

    _open_object_store(mode) { return new Promise((resolve, reject) => {
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
    let filename = this._downloadFilename;
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
}
