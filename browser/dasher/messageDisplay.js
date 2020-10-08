// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

import Piece from './piece.js';

const messageLabelText = "Message:";

export default class MessageDisplay {
    constructor(limits) {
      this._messageDisplay = null;
      this._limits = limits;
      //Popup Window
      this._opener = null;
    }

    load(header,keyboardMode){
      this._load_message(header,keyboardMode);
    }

    loadControls(element){
      // (The `false` parameter specifies don't
      // append, i.e. insert instead.)
      this._messageDiv.add_child(
          element, false);
    }

    update(message){
      if(this._messageDisplay === null){
        return;
      }
      if (this._limits.showDiagnostic) {
          const description = (
              message === "" ? "empty" :
              message === undefined ? "undefined" :
              message === null ? "null" :
              null
          );
          const labels = [messageLabelText];
          if (description !== null) {
              labels.push(" (", description, ")");
          }
          this._messageLabel.firstChild.nodeValue = labels.join("");
      }
      this._messageDisplay.node.textContent = (
          message === undefined ? null : message);

      //popup
      if(this._opener !== null){
        var html = "<html><head></head><body>"+message+"</body></html>";
        this._opener.document.open();
        this._opener.document.write(html);
        this._opener.document.close();
      }

    }
    popupClicked(){
      if(this._opener === null){
        //Open the popup
        this._opener = window.open("","Dasher.mini","width=300,height=300,scrollbars=1,resizable=1");
      }
      else{
        this._opener.close();
        this._opener = null;
      }
    }

    setLabelText(messageLabelText){
      this._messageLabel.firstChild.nodeValue = messageLabelText;
    }

    _load_message(header,keyboardMode) {
        // Textarea in which the message is displayed, and surrounding div.
        this._messageDiv = new Piece(
            'div', header, {'id':"message-holder"});
        const identifierMessage = "message";
        this._messageLabel = this._messageDiv.create(
            'label', {'for':identifierMessage}, messageLabelText);
        this._messageDisplay = new Piece('textarea', this._messageDiv, {
            'id':identifierMessage, 'name':identifierMessage, 'readonly':true,
            'rows': keyboardMode ? 1 : 2, 'cols':80,
            'placeholder':"Message will appear here ..."
        });
    }



};
