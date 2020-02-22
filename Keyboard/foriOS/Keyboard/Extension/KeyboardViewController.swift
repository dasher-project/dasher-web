//
//  KeyboardViewController.swift
//
// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT
//

import UIKit
import WebKit
import CaptiveWebView

class KeyboardViewController:
UIInputViewController, CaptiveWebViewCommandHandler
{
    var wkWebView: WKWebView?
    let dateFormatter = DateFormatter()

    // Just in case the web view doesn't load, there's a safety button to select
    // the next keyboard.
    @IBOutlet var safetyButton: UIButton!
    var logLabel: UILabel!
    
    var heightConstraint: NSLayoutConstraint? = nil

    override func updateViewConstraints() {
        // self.log("updateViewConstraints")
        super.updateViewConstraints()
    }
    
    // Following property was to facilitate changing everything between using
    // `view` and `inputView`. As it's played out, it doesn't seem to make any
    // difference which of those properties is used.
    var framingView:UIView? {
        return self.inputView
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()

        self.dateFormatter.dateStyle = .short
        self.dateFormatter.timeStyle = .long

        // Uncomment the next line to delete the log file on load. It's been
        // better to delete just before the view disappears, so that the log
        // starts with the disappearance.
        // _ = self.deleteLog()

        // Code for the safety button is based on code from the Xcode sample
        // Keyboard extension.
        self.safetyButton = UIButton(type: .system)
        self.safetyButton.setTitle(NSLocalizedString(
            "Next\nKeyboard",
            comment: "Title for 'Next Keyboard' button"), for: [])
        self.safetyButton.titleLabel?.textAlignment = .right
        self.safetyButton.titleLabel?.numberOfLines = 0
        self.safetyButton.sizeToFit()
        self.safetyButton.translatesAutoresizingMaskIntoConstraints = false
        //
        // Following somehow makes the safety button advance to the next keyboard.
        self.safetyButton.addTarget(
            self,
            action: #selector(handleInputModeList(from:with:)),
            for: .allTouchEvents
        )
        self.safetyButton.isHidden = false
        self.view.addSubview(self.safetyButton)
        // The following constraints positions the safety button in the centre
        // of the right-hand edge of the keyboard area.
        self.safetyButton.centerYAnchor.constraint(
            equalTo: self.view.centerYAnchor).isActive = true
        self.safetyButton.rightAnchor.constraint(
            equalTo: self.view.rightAnchor).isActive = true

        // The log label and web view are each required to fill the whole view.
        // This is done by constraining all their anchors to be the same as the
        // view's anchors.
        // To be constructed, each of them needs a frame, but the view frame
        // will be all zeros at this point. So the log label and web view each
        // get an arbitrary frame just for construction purposes, and then
        // immediately get constrained.
        // The view and inputView don't get proper frames until viewDidAppear.

        self.logLabel = UILabel(frame: CGRect(
            x: 0, y: 100, width: 400, height: 100))
        self.logLabel.text = "viewDidLoad"
        self.logLabel.layer.borderColor = UIColor.green.cgColor
        self.logLabel.layer.borderWidth = 2.0

        // Support multiple lines.
        // TOTH: https://stackoverflow.com/a/990244/7657675
        self.logLabel.numberOfLines = 0
        self.logLabel.lineBreakMode = .byCharWrapping

        // Hide it until it can be shown at the correct size.
        self.logLabel.isHidden = true
        self.view.insertSubview(self.logLabel, at:0)
        self.constrain(view: self.logLabel, to: self.view)

        self.wkWebView = CaptiveWebView.makeWebView(
            frame:CGRect(x: 0, y: 0, width: 400, height: 100),
            commandHandler: self)
        if let webView = self.wkWebView {
            webView.isHidden = true
            webView.layer.borderColor = UIColor.blue.cgColor
            webView.layer.borderWidth = 2.0

            // webView.layer.opacity = 0.7
            // Opacity less than 1 allows the logLabel to be seen, which is
            // useful if you're chasing a defect where the web view is
            // unresponsive. The default is 1.

            // Following line adds the web view to the self.view as a sub-view.
            // It's unclear whether it should be added to self.inputView instead.
            // Apple documentation seems to say `inputView` but `view` is used
            // in the Xcode sample code for a keyboard extension.
            self.view.addSubview(webView)
            
            self.constrain(view: webView, to: self.view)
            // Line below instead of the line above will make the web view
            // occupy the left half of the view, which can be useful in
            // development. The log and safety button will then be visible,
            // not behind it.
            // self.constrain(view: webView, to: self.view, leftSide: true)
        }

        self.log("viewDidLoad")
    }
    
    private func constrain(
        view left: UIView, to right: UIView, leftSide:Bool = false
    ) {
        left.translatesAutoresizingMaskIntoConstraints = false
        left.topAnchor.constraint(
            equalTo: right.topAnchor).isActive = true
        left.bottomAnchor.constraint(
            equalTo: right.bottomAnchor).isActive = true
        left.leftAnchor.constraint(
            equalTo: right.leftAnchor).isActive = true
        left.rightAnchor.constraint(
            equalTo: leftSide ? right.centerXAnchor : right.rightAnchor
        ).isActive = true
    }
    
    private func log(_ message: String) {
        let logPath = self.getLogPath()
        if !FileManager.default.fileExists(atPath: logPath.path) {
            // Initialise the log file to an empty array.
            let fileData = try! JSONSerialization.data(
                withJSONObject:[String]())
            try! fileData.write(to: logPath)
        }
        let logAny = try! JSONSerialization.jsonObject(
            with: Data(contentsOf: logPath))
        var log = logAny as! [Any]
        let entry: [String : Any] = [
            "message": message, "index": log.count,
            "time": self.dateFormatter.string(from: Date())]
        log.insert(entry, at: 0)
        if let webView = self.wkWebView {
            CaptiveWebView.sendObject(to: webView, ["log": log])
        }
        if let uiLabel = self.logLabel {
            uiLabel.text = log.map({
                guard let dict = $0 as? Dictionary<String, Any> else {
                    return String(describing: $0)
                }
                if
                    let index = dict["index"] as? Int,
                    let entryTime = dict["time"] as? String,
                    let entryMessage = dict["message"] as? String
                {
                    return [
                        "\(index) ", entryTime, " ", entryMessage].joined()
                }
                else {
                    return String(describing: dict)
                }
            }).joined(separator: "\n")
        }
        let fileData = try! JSONSerialization.data(withJSONObject:log)
        try! fileData.write(to: logPath)
    }
    private func logFrames(_ message: String) {
        var inputViewMessage = "nil"
        if let inputView = self.inputView {
            inputViewMessage = String(describing: inputView.frame)
        }
        self.log(message + " v:\(self.view.frame) i:\(inputViewMessage)")
    }
    
    private func getLogPath() -> URL {
        let fileManager = FileManager.default
        let documentDirectory = fileManager.urls(for: .documentDirectory,
                                                 in: .userDomainMask)[0]
        return documentDirectory.appendingPathComponent("log.json")
    }
    
    private func deleteLog() -> String {
        do {
            try FileManager.default.removeItem(at: self.getLogPath())
            return "OK"
        } catch {
            return error.localizedDescription
        }
    }
    
    override func textWillChange(_ textInput: UITextInput?) {
        // The app is about to change the document's contents. Perform any preparation here.
        // self.log("textWillChange")
    }
    
    override func textDidChange(_ textInput: UITextInput?) {
        // The app has just changed the document's contents, the document context has been updated.
        // self.log("textDidChange")
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        let heightSet = self.setHeight(400)

        var dimensionsMessage = "Dimensions not set"
        if let uiView = self.framingView {
            dimensionsMessage = "y:\(uiView.frame.minY)" +
            " w:\(uiView.frame.width) h:\(uiView.frame.height)"
        }
        if let webView = self.wkWebView {
            webView.layer.borderColor = nil
            webView.layer.borderWidth = 0
            let loaded = CaptiveWebView.load(
                in: webView, scheme: "local", file: "Keyboard.html")
            self.log("viewDidAppear \(loaded) \(dimensionsMessage) \(heightSet)")
        }
        else {
            self.log("viewDidAppear null \(dimensionsMessage) \(heightSet)")
        }
    }
    
    private func setHeight(_ height:CGFloat) -> Bool {
        guard let uiView = self.framingView else {
            return false
        }
        // Discard the current constraint, if there is one.
        if let constraint = self.heightConstraint {
            uiView.removeConstraint(constraint)
            self.heightConstraint = nil
        }
        // Create, apply, and retain a new constraint.
        let constraint = NSLayoutConstraint(
            item: uiView, attribute: .height, relatedBy: .equal,
            toItem: nil, attribute: .notAnAttribute,
            multiplier: 0, constant: height
        )
        uiView.addConstraint(constraint)
        self.heightConstraint = constraint
        return true
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        self.logLabel.isHidden = false
        self.wkWebView?.isHidden = false
        self.logFrames("viewWillAppear")
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)

        // It's very very important to remove the web view from the view
        // hierarchy here and release the object.
        // There was a quite tricky defect that the web view would be just a
        // white box after resuming. The white box could have been a
        // semi-retained but inactive web view.
        // https://stackoverflow.com/a/26383032/7657675
        self.wkWebView?.removeFromSuperview()
        self.wkWebView = nil

        let deleted = self.deleteLog()
        self.log("viewWillDisappear \(deleted) Web view " + (
            self.wkWebView == nil ? "removed" : "unreleased"))
    }
    
    func handleCommand(_ commandDictionary: Dictionary<String, Any>)
        -> Dictionary<String, Any>
    {
        var returning = commandDictionary
        let command = commandDictionary["command"] as! String
        switch command {
        case "insert":
            self.textDocumentProxy.insertText(
                commandDictionary["text"] as! String)
            returning ["removed"] = self.deleteLog()
            
        case "nextKeyboard":
            self.advanceToNextInputMode()
            // Advancing should bin the web view so the return won't happen,
            // unless something goes wrong.
        
        case "ready":
            returning["predictorCommands"] = ["predict"]
            returning["showNextKeyboard"] = self.needsInputModeSwitchKey
            returning["showLog"] = true
        
        case Predictor.Command.name:
            do {
                let response = try Predictor.response(to: commandDictionary)
                returning.merge(response) {(_, new) in new}
            }
            catch {
                returning["failed"] = error.localizedDescription
            }

        default:
            returning["failed"] = "Unknown command \"\(command)\"."
        }

        // Add the log to the response, so that it can be seen.
        let logPath = self.getLogPath()
        let fileManager = FileManager.default
        let logSize: String
        do {
            let attributes = try fileManager.attributesOfItem(
                atPath: logPath.path)
            let logSizeNumber:NSNumber = attributes[.size] as? NSNumber ?? -1
            logSize = String(describing: logSizeNumber)
        } catch {
            logSize = error.localizedDescription
        }
        let logContents:Any
        do {
            logContents = try JSONSerialization.jsonObject(
                with: Data(contentsOf: logPath))
            
        } catch {
            logContents = error.localizedDescription
        }
        
        returning["logPath"] = String(describing: logPath)
        returning["logSize"] = logSize
        returning["logContents"] = logContents
        
        returning["confirm"] = String(describing: type(of: self)) + " bridge OK."
        return returning
    }
    
}
