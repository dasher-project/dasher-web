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
      this._objectStoreKey = 0;
      this._everLoaded = false;
    }
    //TESTS
    getSampleData(){
      return {test:'hello world',time:'06-22-20'};
    }
    testSaveMesage(){
      this.save_to_browser(true);
    }
    testLoadMessages(){
      this.load_from_browser();
    }

    /*************/

    addMessage(){

    }

    viewMessageStore(){

    }
    editMessageStore(){
      //To do- for now, export file, make changes, import new file.
    }
    importFile(){

    }
    exportToFile(){

    }

    save_to_browser(showResult) {
        this._open_object_store("readwrite").catch(() => {}).then(store => {
            const putRequest = store.put(
                this.getSampleData(), this._objectStoreKey);
            putRequest.onsuccess = event => {
                if (showResult) {
                    this._show_result(
                        "Saved OK.",
                        // Only set a detail if the key isn't as expected.
                        event.target.result === this._objectStoreKey ?
                        undefined :
                        event.target.result
                    );
                }
            };
        });
    }

    load_from_browser() {
        this._open_object_store("readonly").catch(() => {}).then(store =>
            store.get(this._objectStoreKey).onsuccess = event => {
                this._show_result("Loaded OK.");
                // , JSON.stringify( event.target.result, undefined, 4));
                console.log(event.target.result);
                this._everLoaded = true;
            }
        )
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

        let justUpgraded = false;
        request.onupgradeneeded = event => {
            // Object store has the same name as the database.
            const database = event.target.result;
            database.createObjectStore(this._databaseName);

            justUpgraded = true;
        };

        request.onsuccess = event => {
            const database = event.target.result;

            const get_store = () => {
                const transaction = database.transaction(
                    [this._databaseName], mode);
                transaction.onerror = event => {
                    this._show_result("Transaction failed", event.target.error);
                }
                resolve(transaction.objectStore(this._databaseName));
            }

            if (justUpgraded) {
                const transaction = database.transaction(
                    [this._databaseName], "readwrite");
                transaction.onerror = event => {
                    this._show_result("Create failed", event.target.error);
                };
                transaction.objectStore(this._databaseName).add(
                    this.getSampleData(), this._objectStoreKey);
                transaction.oncomplete = get_store;
            }
            else {
                get_store();
            }
        };
    });}

  _show_result(outcome, detail){
    console.log(outcome);
    console.log(detail);
  }
}
