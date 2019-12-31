//
//  KeyboardViewController.swift
//  ACE
//
//  Created by Jim Hawkins on 31/12/2019.
//  Copyright © 2019 Jim Hawkins. All rights reserved.
//

import UIKit
import WebKit
import CaptiveWebView

class KeyboardViewController:
UIInputViewController, CaptiveWebViewCommandHandler
{
    var wkWebView: WKWebView?
    var wkWebViewConfiguration: WKWebViewConfiguration?

    override func updateViewConstraints() {
        super.updateViewConstraints()
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // The view and inputView frames are all zeros here. They seem to get
        // created properly in the viewDidAppear. Set an arbitrary frame here.
        let madeWebView = CaptiveWebView.makeWebView(
            frame:CGRect(x: 0, y: 0, width: 100, height: 100),
            commandHandler: self)
        madeWebView.isHidden = true
        
        madeWebView.layer.borderColor = UIColor.green.cgColor
        madeWebView.layer.borderWidth = 2.0
        self.inputView?.addSubview(madeWebView as UIView)
        self.wkWebView = madeWebView
    }
    
    override func textWillChange(_ textInput: UITextInput?) {
        // The app is about to change the document's contents. Perform any preparation here.
    }
    
    override func textDidChange(_ textInput: UITextInput?) {
        // The app has just changed the document's contents, the document context has been updated.
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        
        if let frame = self.inputView?.frame {
            self.wkWebView?.frame = frame
            self.wkWebView?.layer.borderColor = nil
            self.wkWebView?.layer.borderWidth = 0
        }

        _ = CaptiveWebView.load(in: wkWebView!,
                                scheme: "local",
                                file: "Keyboard.html")

        self.wkWebView?.isHidden = false
    }
    
    func handleCommand(_ commandDictionary: Dictionary<String, Any>) -> Dictionary<String, Any> {
        
        var returning = commandDictionary
        let command = commandDictionary["command"] as! String
        switch command {
        case "insert":
            self.textDocumentProxy.insertText(
                commandDictionary["text"] as! String)
            
        case "nextKeyboard":
            self.advanceToNextInputMode()
            // Advancing will bin the web view so the return won't happen,
            // unless something goes wrong.
            
        default:
            returning["failed"] = "Unknown command \"\(command)\"."
        }
        
        returning["confirm"] = String(describing: type(of: self)) + " bridge OK."
        return returning
    }
    
}
