//
//  KeyboardViewController.swift
//
// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT
//

import UIKit
import WebKit
import CaptiveWebView


let dateFormatter = { () -> DateFormatter in
    let formatter = DateFormatter()
    formatter.dateStyle = .short
    formatter.timeStyle = .long
    return formatter
}()

// Utility method for getting a nice string for an enumerated constant. The
// enumeration doesn't seem to have a way to do this like an Android .name
// property.
// TOTH for an extension to an optional value:
// https://stackoverflow.com/a/43061289/7657675
extension Optional where Wrapped == UIKeyboardType {
    func name() -> String? {
        switch self {
        case nil:
            return nil
        case .asciiCapable:
            return "asciiCapable"
        case .decimalPad:
            return "decimalPad"
        case .default:
            return "default"
        case .emailAddress:
            return "emailAddress"
        case .namePhonePad:
            return "namePhonePad"
        case .numberPad:
            return "numberPad"
        case .numbersAndPunctuation:
            return "numbersAndPunctuation"
        case .phonePad:
            return "phonePad"
        case .twitter:
            return "twitter"
        case .URL:
            return "URL"
        case .webSearch:
            return "webSearch"
        case .asciiCapableNumberPad:
            return "asciiCapableNumberPad"
        @unknown default:
            return String(describing: self)
        }
    }
}

// Utility method for getting a nice string for an enumerated constant.
extension Optional where Wrapped == UIKeyboardAppearance {
    func name() -> String? {
        switch self {
        case .dark:
            return "dark"
        case .none:
            // This one is actually nil. You can tell by adding a case for nil.
            return "none"
        case .default:
            return "default"
        case .light:
            return "light"
        @unknown default:
            return String(describing: self)
        }
    }
}

// Utility method for extracting the function name part of a #function value.
// Used for logging.
extension String {
    func functionName() -> String {
        if let index = firstIndex(of: "(") {
            return String(prefix(upTo: index))
        }
        else {
            return self
        }
    }
}

// Utility method for copying some properties from a type into a dictionary.
extension UITextDocumentProxy {
    func asDictionary() -> [String:Any?] {
        var returning = [
            "hasText": hasText,
            "identifier": documentIdentifier.uuidString,
            "keyboardType": self.keyboardType.name(),
            "keyboardAppearance": self.keyboardAppearance.name()
            // documentInputMode isn't included because it's always nil or
            // something about the current selected language in the document.
        ] as [String:Any?]

        var value:String? = nil
        // For some reason, self.textContentType == nil was always false.
        if let it = self.textContentType as? UITextContentType {
            value = "\(it)"
        }
        // TOTH for how to set nil into a dictionary:
        // https://stackoverflow.com/a/36542735/7657675
        returning.updateValue(value, forKey: "textContentType")

        return returning
    }
}

class KeyboardViewController:
UIInputViewController, CaptiveWebViewCommandHandler
{
    // Just in case the web view doesn't load, there's a safety button to select
    // the next keyboard.
    @IBOutlet var safetyButton: UIButton!

    var heightConstraint: NSLayoutConstraint? = nil

    // Following property was to facilitate changing everything between using
    // `view` and `inputView`. As it's played out, it doesn't seem to make any
    // difference which of those properties is used.
    var framingView:UIView? {
        return self.inputView
    }
    
    // Following doesn't get invoked if there is a Bluetooth keyboard connected.
    // Maybe because this is a keyboard extension. The key presses seem to get
    // sent to the principal app that is open, not to the custom keyboard.
    override func pressesBegan(
        _ presses: Set<UIPress>, with event: UIPressesEvent?
    ) {
        self.log(callback: #function, "(\(presses),\(String(describing: event)))")
    }
    
    // Negative demonstration of Key Value Observing (KVO) starts here.
    //
    // These properties demonstrate that KVO works in Swift and that the syntax
    // here is correct.
    @objc dynamic var obsInt:Int = 0
    @objc dynamic var obsTring:String = "."
    //
    // Next property will be an instance of the Observer class, below.
    var observer:Observer? = nil
    //
    // TOTH KVO in Swift:
    // https://nalexn.github.io/kvo-guide-for-key-value-observing/
    class Observer: NSObject {
        var observations: [NSKeyValueObservation]?
        
        init(_ controller:KeyboardViewController) {
            super.init()

            observations = [
                controller.observe(\.obsInt, options: [.old, .new]) {
                    observed, change in
                    controller.log("obsInt",
                                   String(describing: change.oldValue),
                                   String(describing: change.newValue))
                },
                controller.observe(\.obsTring, options: [.old, .new]) {
                    observed, change in
                    controller.log("obsTring",
                                   String(describing: change.oldValue),
                                   String(describing: change.newValue))
                },
                
                // Next observe() never gets invoked, either because the prefix
                // of the key path would have to be moved in between controller
                // and .observe, or because UITextDocumentProxy doesn't comply
                // with Key Value Observing (KVO).
                controller.observe(
                    \.textDocumentProxy.documentContextBeforeInput,
                    options: [.old, .new]) {
                    observed, change in
                    controller.log("obsBef",
                                   String(describing: change.oldValue),
                                   String(describing: change.newValue))
                }

            ]
        }
    }

    // The actual web view in which the Dasher UI will run. It can't be
    // initialised here because self hasn't been initialised and self will be
    // its command handler.
    var wkWebView: WKWebView?
    
    // Readiness flag used by the logging code.
    var wkWebViewReady = false

    // Native log is displayed in a UILabel. It should only be used
    //
    // -   Before the web view is loaded and reported itself ready.
    // -   When the web view reports an error in response to a log command.
    var logLabel = UILabel(frame:CGRect(x: 0, y: 100, width: 400, height: 100))

    override func viewDidLoad() {
        super.viewDidLoad()

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
        // get constrained here.
        // The view and inputView don't get proper frames until viewDidAppear.
        //
        // The log label gets a green border to show that the constraints are
        // working as expected. The border is only visible if the web view isn't
        // there, or isn't completely opaque. The logging code reduces the web
        // view's opacity if it returns an error to a log command, meaning that
        // it hasn't displayed a log message, so the log message gets displayed
        // in the native layer instead.
        self.logLabel.layer.borderColor = UIColor.green.cgColor
        self.logLabel.layer.borderWidth = 2.0
        self.logLabel.text = "viewDidLoad"

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
            // The logging code can reduce opacity if it seems necessary to show
            // the native log label.

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

        self.log(callback: #function)
        
        // Demonstration of KVO, see comments above.
        observer = Observer(self)
        obsInt += 1
        obsTring += "segment"
    }

    // Utility method to constrain one view to another, or to the left half of
    // another.
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

    // Earlier versions of the code used dictionaries for log entries. It was a
    // bit error prone so it was replaced with a Codable. JSON is still used as
    // the writing and reading format.
    // This struct is automatically Codable because all its properties are
    // Codable.
    private struct LogEntry:Codable {
        let time:String
        let messages: [String]
        let index:Int
        let proxy:[String?]
        
        init(
            _ messages:[String],
            _ index:Int,
            _ documentProxy:UITextDocumentProxy
        ) {
            self.time = dateFormatter.string(from:Date())
            self.messages = messages
            self.index = index
            self.proxy = [
                documentProxy.documentContextBeforeInput,
                documentProxy.selectedText,
                documentProxy.documentContextAfterInput
            ]
        }
    }

    // You sometimes need to wrap an Encodable in a real type. It's something to
    // do with Encodable being a protocol, not a class.
    private struct AnyEncodable:Encodable {
        let encodable:Encodable
        
        init(_ encodable:Encodable) {
            self.encodable = encodable
        }

        func encode(to encoder: Encoder) throws {
            try encodable.encode(to: encoder)
        }
    }

    // Logging code.
    //
    // Logs are written to a JSON file that is saved after every message. That
    // way, if the extension or app crashes, there's a chance of a clue.
    //
    // Main logging function.
    private func log(_ messages:String?...) {
        // Read the log file.
        //
        // If the log file is absent, a new empty one will be created. The
        // proper way to do that is to write an empty JSON array into it, which
        // would need a JSON encoder. So, instantiate one here.
        let encoder = JSONEncoder()
        let logPath = self.getLogPath()
        if !FileManager.default.fileExists(atPath: logPath.path) {
            // Initialise the log file to an empty array.
            let fileData = try! encoder.encode([LogEntry]())
            try! fileData.write(to: logPath)
        }
        //
        // Now actually read the file into an array of LogEntry.
        let decoder = JSONDecoder()
        var log:[LogEntry] = try! decoder.decode(
            [LogEntry].self, from: Data(contentsOf: logPath))

        // Create a LogEntry for the current log message. The compactMap filters
        // out any null elements.
        let logEntry = LogEntry(
            messages.compactMap({$0}), log.count + 1, textDocumentProxy)
        //
        // Contents of the log file are most recent first.
        log.insert(logEntry, at: 0)

        // Create a JSON representation of the whole log. That's what'll be
        // sent to the web view to display.
        let sendLog:[[String:Any]]
        do {
            // Re-use the JSON encoder instantiated at the top of the function.
            let encoded = try encoder.encode(log)
            let any = try JSONSerialization.jsonObject(with: encoded, options: [])
            if let dict = any as? [[String:Any]] {
                sendLog = dict
            }
            else {
                sendLog = [["uncast":"\(any)"]]
            }
        }
        catch {
            sendLog = [["catch": error, "entry": "\(logEntry)"]]
        }

        // Send the log to the web view, if it's finished loading and is ready
        // to receive and display.
        if wkWebViewReady, let webView = self.wkWebView {
            CaptiveWebView.sendObject(to: webView, ["log": sendLog]) {
                (result: Any?, resultError: Error?) in
                if let error = resultError {
                    self.showLog(["error":"\(error)", "entry":"\(logEntry)"])
                }
            }
        }
        else {
            self.showLog(log)
        }

        // Write the new log.
        let fileData = try! encoder.encode(log)
        try! fileData.write(to: logPath)
    }
    //
    // Convenience function for logging callback invocation.
    private func log(callback: String, _ notes: String...) {
        log(([callback.functionName()] + notes).joined(separator: " "))
    }
    //
    // Convenience function for logging callback invocations that receive a
    // UITextInput instance.
    private func log(_ callbackName: String, _ textInput: UITextInput?) {
        let description:String
        if let input = textInput {
            description = "\(input)"
        }
        else {
            description = "null"
        }
        log([
            callbackName.functionName(), "(", description, ")"
        ].joined(separator: ""))
    }
    //
    // Plan B log display function. Plan B is to set the log as text onto the
    // log label, and make the web view transparent so the label can be seen.
    private func showLog(_ entries: Encodable) {
        let encoder = JSONEncoder()
        let text:String
        do {
            let encoded:Data = try encoder.encode(AnyEncodable(entries))
            text = String(data:encoded, encoding:.utf8)
                ?? "utf8 failed String(\(encoded),)"
        }
        catch {
            text = "error:\(error) entries:\(entries)"
        }
        logLabel.text = text

        if wkWebViewReady, let webView = self.wkWebView {
            webView.layer.opacity = 0.5
        }

    }
    //
    // Log a message and the frame sizes of the view and inputView.
    private func logFrames(_ message: String) {
        var inputViewMessage = "nil"
        if let inputView = self.inputView {
            inputViewMessage = String(describing: inputView.frame)
        }
        self.log(message + " v:\(self.view.frame) i:\(inputViewMessage)")
    }
    //
    // Convenience function to get the path of the log file.
    private func getLogPath() -> URL {
        let fileManager = FileManager.default
        let documentDirectory = fileManager.urls(for: .documentDirectory,
                                                 in: .userDomainMask)[0]
        return documentDirectory.appendingPathComponent("log.json")
    }
    //
    // Delete the log file.
    private func deleteLog() -> String {
        do {
            try FileManager.default.removeItem(at: self.getLogPath())
            return "OK"
        } catch {
            return error.localizedDescription
        }
    }

    // Dummy callback implementations that log their calling. Some of these
    // never get invoked.

    override func textWillChange(_ textInput: UITextInput?) {
        super.textWillChange(textInput)
        // The app is about to change the document's contents. Perform any preparation here.
        self.log(#function, textInput)
    }
    
    override func textDidChange(_ textInput: UITextInput?) {
        super.textDidChange(textInput)
        // The app has just changed the document's contents, the document context has been updated.
        
        // KVO demonstration.
        obsInt += 1
        obsTring += ".\(obsInt)"
        self.log(#function, textInput)
    }
    
    override func selectionWillChange(_ textInput: UITextInput?) {
        // Never seems to get invoked.
        self.log(#function, textInput)
    }

    override func selectionDidChange(_ textInput: UITextInput?) {
        // Never seems to get invoked.
        self.log(#function, textInput)
    }

    // The viewDidAppear is the first point at which the views have proper
    // sizes. This means that the web view can be loaded. It will already be
    // constrained to fill the framing view.
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        // Start with a default height.
        let heightSet = self.setHeight(400)

        var dimensionsMessage = "Dimensions not set"
        if let uiView = self.framingView {
            dimensionsMessage = "y:\(uiView.frame.minY)" +
            " w:\(uiView.frame.width) h:\(uiView.frame.height)"
        }
        if let webView = self.wkWebView {
            // Remove the web view's diagnostic border and tell it to load the
            // Dasher keyboard.
            webView.layer.borderColor = nil
            webView.layer.borderWidth = 0
            let loaded = CaptiveWebView.load(
                in: webView, scheme: "local", file: "Keyboard.html")
            self.log(
                callback: #function
                , "\(loaded)", dimensionsMessage, "\(heightSet)")
        }
        else {
            self.log(
                callback: #function, "null", dimensionsMessage, "\(heightSet)")
        }
        self.log(callback: #function)
    }

    // Utility method to set the height of the framing view, and hence the
    // native log label and web view by constraints.
    // The height is set by programmatically instantiating a height constraint.
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
        self.logFrames(#function.functionName())
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

        self.log(
            callback: #function, self.deleteLog(),
            "Web view " + (self.wkWebView == nil ? "removed" : "unreleased")
        )
    }

    // Captive Web View command handler native end.
    //
    // Commands from the Dasher JS layer come here to be serviced.
    func handleCommand(_ commandDictionary: Dictionary<String, Any>)
        -> Dictionary<String, Any>
    {
        var returning = commandDictionary
        let command = commandDictionary["command"] as! String
        switch command {
        case "insert":
            // Insert text into the principal app. This is what the whole piece
            // is here to do. Also delete the log file here. Everything in the
            // Dasher UI gets reset so it makes sense.
            self.textDocumentProxy.insertText(
                commandDictionary["text"] as! String)
            returning ["removed"] = self.deleteLog()
            
        case "nextKeyboard":
            // This is the Plan A of the safety button. The command could only
            // be received if the ready response, below, set
            // showNextKeyboard:True.
            // Advancing should bin the web view so the return won't happen,
            // unless something goes wrong.
            self.advanceToNextInputMode()
        
        case "ready":
            // The ready command is the first thing received from the JS layer.
            // It means that the code in the web view is ready. Send it the
            // configuration needed to finalise its UI.
            self.wkWebViewReady = true
            returning.merge([
                "predictorCommands": "predict",
                "showNextKeyboard": self.needsInputModeSwitchKey,
                "showLog": true,
                "documentProxy": textDocumentProxy.asDictionary()
            ]){ (_, new) in new }

        case Predictor.Command.name:
            // Call out to the native predictive text. This is just a
            // pass-through.
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
